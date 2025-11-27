import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Problems table for storing DSA problems
export const problems = pgTable("problems", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  platform: varchar("platform").notNull(), // 'leetcode', 'gfg', ''
  difficulty: varchar("difficulty"), // 'easy', 'medium', 'hard'
  category: varchar("category"), // 'array', 'string', 'tree', etc.
  tags: text("tags").array(), // Additional tags
  url: varchar("url"),
  solved: timestamp("solved").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Problem recommendations table
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  problemName: varchar("problem_name").notNull(),
  platform: varchar("platform").notNull(),
  difficulty: varchar("difficulty"),
  category: varchar("category").notNull(),
  reason: text("reason"), // AI-generated reason
  url: varchar("url"),
  score: integer("score").default(0), // Recommendation score based on user's history
  createdAt: timestamp("created_at").defaultNow(),
});

// Platform credentials table for scraping
export const platformCredentials = pgTable("platform_credentials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // 'leetcode', 'gfg', 'tuf'
  username: varchar("username").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  problems: many(problems),
  recommendations: many(recommendations),
  platformCredentials: many(platformCredentials),
}));

export const problemsRelations = relations(problems, ({ one }) => ({
  user: one(users, {
    fields: [problems.userId],
    references: [users.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  user: one(users, {
    fields: [recommendations.userId],
    references: [users.id],
  }),
}));

export const platformCredentialsRelations = relations(platformCredentials, ({ one }) => ({
  user: one(users, {
    fields: [platformCredentials.userId],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertProblemSchema = createInsertSchema(problems).omit({
  id: true,
  userId: true,
  solved: true,
  createdAt: true,
}).extend({
  tags: z.array(z.string()).optional(),
  difficulty: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertPlatformCredentialSchema = createInsertSchema(platformCredentials).omit({
  id: true,
  userId: true,
  lastSyncAt: true,
  createdAt: true,
  updatedAt: true,
});



// 1. NEW TABLE: Store the "Big Numbers" here
export const platformStats = pgTable("platform_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // stored as text based on your user table
  platform: text("platform").notNull(), // 'leetcode' or 'gfg'
  totalSolved: integer("total_solved").default(0),
  easySolved: integer("easy_solved").default(0),
  mediumSolved: integer("medium_solved").default(0),
  hardSolved: integer("hard_solved").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertPlatformStatsSchema = createInsertSchema(platformStats);
export type InsertPlatformStats = z.infer<typeof insertPlatformStatsSchema>;
export type PlatformStat = typeof platformStats.$inferSelect;

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type PlatformCredential = typeof platformCredentials.$inferSelect;
export type InsertPlatformCredential = z.infer<typeof insertPlatformCredentialSchema>;
