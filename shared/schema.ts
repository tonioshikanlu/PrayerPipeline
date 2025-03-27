import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["regular", "leader", "admin"] }).default("regular").notNull(),
});

// Groups table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  privacy: text("privacy", { enum: ["open", "request", "invite"] }).default("open").notNull(),
  leaderRotation: integer("leader_rotation").default(0), // 0 = no rotation, 30 = 30 days, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role", { enum: ["member", "leader"] }).default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Prayer requests table
export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  urgency: text("urgency", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  status: text("status", { enum: ["waiting", "answered", "declined"] }).default("waiting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", { 
    enum: ["new_request", "new_comment", "status_update", "added_to_group"] 
  }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  referenceId: integer("reference_id"), // ID of the related entity (request, comment, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prayer tracking
export const prayingFor = pgTable("praying_for", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull(),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  privacy: true,
  leaderRotation: true,
  createdBy: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).pick({
  groupId: true,
  userId: true,
  title: true,
  description: true,
  urgency: true,
  isAnonymous: true,
  status: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  prayerRequestId: true,
  userId: true,
  text: true,
  isPrivate: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  message: true,
  referenceId: true,
});

export const insertPrayingForSchema = createInsertSchema(prayingFor).pick({
  prayerRequestId: true,
  userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type PrayingFor = typeof prayingFor.$inferSelect;
export type InsertPrayingFor = z.infer<typeof insertPrayingForSchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;
