import { ChildProcess, spawn } from "child_process";
import { storage } from "./storage";
import { BotStatus } from "@shared/schema";
import path from "path";
import { promises as fs } from "fs";

interface BotProcess {
  process: ChildProcess | null;
  restartOnCrash: boolean;
  logBuffer: string[];
}

class BotManager {
  private processes: Map<string, BotProcess> = new Map();
  private readonly MAX_LOG_BUFFER = 1000;

  async startBot(botId: string): Promise<void> {
    const bot = await storage.getBot(botId);
    if (!bot) {
      throw new Error("Bot not found");
    }

    if (this.processes.has(botId) && this.processes.get(botId)?.process) {
      throw new Error("Bot is already running");
    }

    await storage.updateBot(botId, { status: BotStatus.RUNNING });

    const botPath = bot.folderPath;
    const entryFile = bot.entryFile;
    const fullPath = path.join(botPath, entryFile);

    try {
      const childProcess = spawn("node", [fullPath], {
        cwd: botPath,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const botProcess: BotProcess = {
        process: childProcess,
        restartOnCrash: true,
        logBuffer: [],
      };

      this.processes.set(botId, botProcess);

      childProcess.stdout?.on("data", (data) => {
        const message = data.toString();
        this.addLog(botId, message);
        this.broadcastLog(botId, message, "info");
      });

      childProcess.stderr?.on("data", (data) => {
        const message = data.toString();
        this.addLog(botId, message);
        this.broadcastLog(botId, message, "error");
      });

      childProcess.on("exit", async (code) => {
        const botProc = this.processes.get(botId);
        
        if (code !== 0 && botProc?.restartOnCrash) {
          this.processes.delete(botId);
          await storage.updateBot(botId, { status: BotStatus.RESTARTING });
          this.broadcastLog(
            botId,
            `Bot crashed with code ${code}. Restarting in 5 seconds...`,
            "warn"
          );

          setTimeout(async () => {
            try {
              await this.startBot(botId);
            } catch (error) {
              await storage.updateBot(botId, { status: BotStatus.ERROR });
              this.broadcastLog(
                botId,
                `Failed to restart bot: ${error instanceof Error ? error.message : String(error)}`,
                "error"
              );
            }
          }, 5000);
        } else {
          this.processes.delete(botId);
          await storage.updateBot(botId, { status: BotStatus.STOPPED });
        }
      });

      childProcess.on("error", async (error) => {
        await storage.updateBot(botId, { status: BotStatus.ERROR });
        this.broadcastLog(botId, `Bot error: ${error.message}`, "error");
        this.processes.delete(botId);
      });
    } catch (error) {
      await storage.updateBot(botId, { status: BotStatus.ERROR });
      throw error;
    }
  }

  async stopBot(botId: string): Promise<void> {
    const botProcess = this.processes.get(botId);
    if (!botProcess || !botProcess.process) {
      throw new Error("Bot is not running");
    }

    botProcess.restartOnCrash = false;

    return new Promise((resolve) => {
      botProcess.process!.once("exit", () => {
        this.processes.delete(botId);
        storage.updateBot(botId, { status: BotStatus.STOPPED });
        resolve();
      });

      botProcess.process!.kill();

      setTimeout(() => {
        if (botProcess.process && !botProcess.process.killed) {
          botProcess.process.kill("SIGKILL");
        }
        resolve();
      }, 5000);
    });
  }

  async restartBot(botId: string): Promise<void> {
    await this.stopBot(botId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.startBot(botId);
  }

  async deleteBot(botId: string): Promise<void> {
    if (this.processes.has(botId)) {
      await this.stopBot(botId);
    }

    const bot = await storage.getBot(botId);
    if (bot) {
      try {
        await fs.rm(bot.folderPath, { recursive: true, force: true });
      } catch (error) {
        console.error(`Failed to delete bot folder: ${error}`);
      }
    }

    await storage.deleteBot(botId);
  }

  private addLog(botId: string, message: string) {
    const botProcess = this.processes.get(botId);
    if (botProcess) {
      botProcess.logBuffer.push(message);
      if (botProcess.logBuffer.length > this.MAX_LOG_BUFFER) {
        botProcess.logBuffer.shift();
      }
    }
  }

  getLogs(botId: string): string[] {
    return this.processes.get(botId)?.logBuffer || [];
  }

  private broadcastLog(botId: string, message: string, level: string) {
    // This will be connected to WebSocket in routes.ts
    if (global.wsBroadcast) {
      global.wsBroadcast({
        type: "log",
        botId,
        message: message.trim(),
        level,
      });
    }
  }

  async restoreBotsOnStartup() {
    const bots = await storage.getAllBots();
    const runningBots = bots.filter((bot) => bot.status === BotStatus.RUNNING);

    for (const bot of runningBots) {
      try {
        await this.startBot(bot.id);
      } catch (error) {
        console.error(`Failed to restore bot ${bot.name}:`, error);
        await storage.updateBot(bot.id, { status: BotStatus.ERROR });
      }
    }
  }
}

export const botManager = new BotManager();

declare global {
  var wsBroadcast: ((data: any) => void) | undefined;
}
