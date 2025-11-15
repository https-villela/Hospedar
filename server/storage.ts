import { type Bot, type InsertBot } from "@shared/schema";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const BOTS_FILE = path.join(process.cwd(), "bots-data.json");

export interface IStorage {
  getAllBots(): Promise<Bot[]>;
  getBot(id: string): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private bots: Map<string, Bot>;
  private initialized: boolean = false;

  constructor() {
    this.bots = new Map();
    this.loadFromFile();
  }

  private async loadFromFile() {
    if (this.initialized) return;
    
    try {
      const data = await fs.readFile(BOTS_FILE, "utf-8");
      const botsArray: Bot[] = JSON.parse(data);
      this.bots = new Map(botsArray.map((bot) => [bot.id, bot]));
      this.initialized = true;
    } catch (error) {
      this.bots = new Map();
      this.initialized = true;
    }
  }

  private async saveToFile() {
    try {
      const botsArray = Array.from(this.bots.values());
      await fs.writeFile(BOTS_FILE, JSON.stringify(botsArray, null, 2));
    } catch (error) {
      console.error("Failed to save bots to file:", error);
    }
  }

  async getAllBots(): Promise<Bot[]> {
    await this.loadFromFile();
    return Array.from(this.bots.values());
  }

  async getBot(id: string): Promise<Bot | undefined> {
    await this.loadFromFile();
    return this.bots.get(id);
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    await this.loadFromFile();
    const id = randomUUID();
    const bot: Bot = {
      ...insertBot,
      id,
      uploadDate: new Date(),
    };
    this.bots.set(id, bot);
    await this.saveToFile();
    return bot;
  }

  async updateBot(id: string, updates: Partial<Bot>): Promise<Bot | undefined> {
    await this.loadFromFile();
    const bot = this.bots.get(id);
    if (!bot) return undefined;

    const updatedBot = { ...bot, ...updates };
    this.bots.set(id, updatedBot);
    await this.saveToFile();
    return updatedBot;
  }

  async deleteBot(id: string): Promise<boolean> {
    await this.loadFromFile();
    const deleted = this.bots.delete(id);
    if (deleted) {
      await this.saveToFile();
    }
    return deleted;
  }
}

export const storage = new MemStorage();
