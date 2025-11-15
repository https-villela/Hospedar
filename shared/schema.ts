import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Bot schema for Discord bot hosting
export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("stopped"), // running, stopped, error, restarting
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  entryFile: text("entry_file").notNull(), // The main file to run (index.js, main.js, bot.js)
  folderPath: text("folder_path").notNull(), // Path where bot files are stored
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  uploadDate: true,
});

export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;

// Bot status enum for type safety
export const BotStatus = {
  RUNNING: "running",
  STOPPED: "stopped",
  ERROR: "error",
  RESTARTING: "restarting",
} as const;

export type BotStatusType = typeof BotStatus[keyof typeof BotStatus];
