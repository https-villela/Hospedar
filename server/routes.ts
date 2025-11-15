import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import AdmZip from "adm-zip";
import { storage } from "./storage";
import { botManager } from "./bot-manager";
import { BotStatus } from "@shared/schema";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

const BOTS_DIR = path.join(process.cwd(), "bots");
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed"));
    }
  },
});

async function ensureDirectories() {
  await fs.mkdir(BOTS_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

async function detectEntryFile(extractPath: string): Promise<string | null> {
  const possibleEntryFiles = ["index.js", "main.js", "bot.js"];

  for (const file of possibleEntryFiles) {
    const filePath = path.join(extractPath, file);
    try {
      await fs.access(filePath);
      return file;
    } catch {
      continue;
    }
  }

  const files = await fs.readdir(extractPath);
  for (const file of files) {
    if (file.endsWith(".js")) {
      const filePath = path.join(extractPath, file);
      const content = await fs.readFile(filePath, "utf-8");
      if (content.includes("client.login")) {
        return file;
      }
    }
  }

  return null;
}

async function safeExtractZip(zipPath: string, extractPath: string): Promise<void> {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  
  const resolvedExtractPath = path.resolve(extractPath);
  
  for (const entry of entries) {
    if (entry.isDirectory) {
      continue;
    }
    
    if (entry.entryName.includes("..") || path.isAbsolute(entry.entryName)) {
      throw new Error(`Invalid zip entry detected: ${entry.entryName}`);
    }
    
    const targetPath = path.resolve(extractPath, entry.entryName);
    
    if (!targetPath.startsWith(resolvedExtractPath + path.sep) && targetPath !== resolvedExtractPath) {
      throw new Error(`Path traversal attempt detected: ${entry.entryName}`);
    }
    
    const targetDir = path.dirname(targetPath);
    await fs.mkdir(targetDir, { recursive: true });
    
    const data = entry.getData();
    await fs.writeFile(targetPath, data);
  }
}

async function runNpmInstall(botPath: string): Promise<void> {
  const { spawn } = await import("child_process");

  return new Promise((resolve, reject) => {
    const packageJsonPath = path.join(botPath, "package.json");
    
    fs.access(packageJsonPath)
      .then(() => {
        const npmProcess = spawn("npm", ["install"], {
          cwd: botPath,
          stdio: "pipe",
        });

        let errorOutput = "";

        npmProcess.stderr?.on("data", (data) => {
          errorOutput += data.toString();
        });

        npmProcess.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`npm install failed: ${errorOutput}`));
          }
        });

        npmProcess.on("error", (error) => {
          reject(error);
        });
      })
      .catch(() => {
        resolve();
      });
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureDirectories();

  app.get("/api/bots", async (req, res) => {
    try {
      const bots = await storage.getAllBots();
      res.json(bots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  app.post(
    "/api/bots/upload",
    upload.single("bot"),
    async (req, res) => {
      let uploadedFilePath: string | null = null;
      let extractPath: string | null = null;

      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        uploadedFilePath = req.file.path;
        const botId = randomUUID();
        extractPath = path.join(BOTS_DIR, botId);

        await fs.mkdir(extractPath, { recursive: true });

        try {
          await safeExtractZip(uploadedFilePath, extractPath);
        } catch (extractError) {
          await fs.rm(extractPath, { recursive: true, force: true });
          await fs.unlink(uploadedFilePath);
          throw extractError;
        }

        await fs.unlink(uploadedFilePath);
        uploadedFilePath = null;

        const entryFile = await detectEntryFile(extractPath);
        if (!entryFile) {
          await fs.rm(extractPath, { recursive: true, force: true });
          return res.status(400).json({
            message:
              "Could not find a valid entry file (index.js, main.js, bot.js, or file with client.login)",
          });
        }

        try {
          await runNpmInstall(extractPath);
        } catch (error) {
          console.error("npm install failed:", error);
        }

        const botName =
          req.file.originalname.replace(".zip", "") || `Bot-${botId.slice(0, 8)}`;

        const bot = await storage.createBot({
          name: botName,
          status: BotStatus.STOPPED,
          entryFile,
          folderPath: extractPath,
        });

        res.json(bot);
      } catch (error) {
        console.error("Upload error:", error);

        if (uploadedFilePath) {
          try {
            await fs.unlink(uploadedFilePath);
          } catch {}
        }
        
        if (extractPath) {
          try {
            await fs.rm(extractPath, { recursive: true, force: true });
          } catch {}
        }

        res.status(500).json({
          message: error instanceof Error ? error.message : "Upload failed",
        });
      }
    }
  );

  app.post("/api/bots/:id/start", async (req, res) => {
    try {
      await botManager.startBot(req.params.id);
      const bot = await storage.getBot(req.params.id);
      res.json(bot);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to start bot",
      });
    }
  });

  app.post("/api/bots/:id/stop", async (req, res) => {
    try {
      await botManager.stopBot(req.params.id);
      const bot = await storage.getBot(req.params.id);
      res.json(bot);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to stop bot",
      });
    }
  });

  app.post("/api/bots/:id/restart", async (req, res) => {
    try {
      await botManager.restartBot(req.params.id);
      const bot = await storage.getBot(req.params.id);
      res.json(bot);
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to restart bot",
      });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    try {
      await botManager.deleteBot(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to delete bot",
      });
    }
  });

  app.get("/uptime", (req, res) => {
    res.json({ status: "online", uptime: process.uptime() });
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "subscribe" && data.botId) {
          const logs = botManager.getLogs(data.botId);
          logs.forEach((log) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "log",
                  botId: data.botId,
                  message: log,
                  level: "info",
                })
              );
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  global.wsBroadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  botManager.restoreBotsOnStartup();

  return httpServer;
}
