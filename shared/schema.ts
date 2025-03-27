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
  phone: text("phone"),
  avatar: text("avatar"),
  bio: text("bio"),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
});

// Organization members table
export const organizationMembers = pgTable("organization_members", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role", { enum: ["member", "admin"] }).default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Groups table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").notNull(),
  category: text("category", { enum: ["health", "career", "family", "relationship", "other"] }).default("other").notNull(),
  privacy: text("privacy", { enum: ["open", "request", "invite"] }).default("open").notNull(),
  leaderRotation: integer("leader_rotation").default(0), // 0 = no rotation, 30 = 30 days, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
});

// Organization tags table
export const organizationTags = pgTable("organization_tags", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(), // hexadecimal color code
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Group tags junction table
export const groupTags = pgTable("group_tags", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  tagId: integer("tag_id").notNull(),
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
  followUpDate: timestamp("follow_up_date"),
  isStale: boolean("is_stale").default(false).notNull(),
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
    enum: [
      "new_request", "new_comment", "status_update", 
      "added_to_group", "added_to_organization", "org_role_changed", "invited_to_organization",
      "new_meeting", "meeting_updated", "meeting_cancelled", "meeting_reminder"
    ] 
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

// Push notification subscriptions
export const subscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  // App-level notification settings
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  inAppNotifications: boolean("in_app_notifications").default(true).notNull(),
  // Per-type notification settings
  prayerRequests: boolean("prayer_requests").default(true).notNull(),
  groupInvitations: boolean("group_invitations").default(true).notNull(),
  comments: boolean("comments").default(true).notNull(),
  statusUpdates: boolean("status_updates").default(true).notNull(),
  groupUpdates: boolean("group_updates").default(true).notNull(),
  // Stale prayer request reminder settings
  stalePrayerReminders: boolean("stale_prayer_reminders").default(true).notNull(),
  reminderInterval: integer("reminder_interval").default(7).notNull(), // Days before a prayer request is considered stale
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Group-specific notification preferences
export const groupNotificationPreferences = pgTable("group_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  groupId: integer("group_id").notNull(),
  // Notification settings for this specific group
  muted: boolean("muted").default(false).notNull(),
  newPrayerRequests: boolean("new_prayer_requests").default(true).notNull(),
  prayerStatusUpdates: boolean("prayer_status_updates").default(true).notNull(),
  newComments: boolean("new_comments").default(true).notNull(),
  groupUpdates: boolean("group_updates").default(true).notNull(),
  meetingReminders: boolean("meeting_reminders").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    name: true,
    email: true,
    role: true,
    phone: true,
    avatar: true,
    bio: true,
  })
  .extend({
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
  });

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  description: true,
  createdBy: true,
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).pick({
  organizationId: true,
  userId: true,
  role: true,
});

export const insertOrganizationTagSchema = createInsertSchema(organizationTags).pick({
  organizationId: true,
  name: true,
  color: true,
});

export const insertGroupTagSchema = createInsertSchema(groupTags).pick({
  groupId: true,
  tagId: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  organizationId: true,
  category: true,
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
  followUpDate: true,
  isStale: true,
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

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  endpoint: true,
  p256dh: true,
  auth: true,
  userAgent: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).pick({
  userId: true,
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  prayerRequests: true,
  groupInvitations: true,
  comments: true,
  statusUpdates: true,
  groupUpdates: true,
  stalePrayerReminders: true,
  reminderInterval: true,
});

export const insertGroupNotificationPreferencesSchema = createInsertSchema(groupNotificationPreferences).pick({
  userId: true,
  groupId: true,
  muted: true,
  newPrayerRequests: true,
  prayerStatusUpdates: true,
  newComments: true,
  groupUpdates: true,
  meetingReminders: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;

export type OrganizationTag = typeof organizationTags.$inferSelect;
export type InsertOrganizationTag = z.infer<typeof insertOrganizationTagSchema>;

export type GroupTag = typeof groupTags.$inferSelect;
export type InsertGroupTag = z.infer<typeof insertGroupTagSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

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

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferencesSchema>;

export type GroupNotificationPreference = typeof groupNotificationPreferences.$inferSelect;
export type InsertGroupNotificationPreference = z.infer<typeof insertGroupNotificationPreferencesSchema>;

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

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// Meetings table
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  meetingType: text("meeting_type", { enum: ["zoom", "google_meet"] }).notNull(),
  meetingLink: text("meeting_link").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringPattern: text("recurring_pattern", { 
    enum: ["daily", "weekly", "biweekly", "monthly"] 
  }),
  recurringDay: integer("recurring_day"), // 0-6 for weekly (0 = Sunday), 1-31 for monthly
  recurringUntil: timestamp("recurring_until"), // When the recurring series ends, null for indefinite
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  parentMeetingId: integer("parent_meeting_id"), // For recurring instances, points to the original meeting
});

// Meeting notes table
export const meetingNotes = pgTable("meeting_notes", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
});

// Insert schemas
export const insertMeetingSchema = createInsertSchema(meetings).pick({
  groupId: true,
  title: true,
  description: true,
  meetingType: true,
  meetingLink: true,
  startTime: true,
  endTime: true,
  isRecurring: true,
  recurringPattern: true,
  recurringDay: true,
  recurringUntil: true,
  createdBy: true,
  parentMeetingId: true,
});

export const insertMeetingNotesSchema = createInsertSchema(meetingNotes).pick({
  meetingId: true,
  content: true,
  summary: true,
  isAiGenerated: true,
});

// Types
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export type MeetingNote = typeof meetingNotes.$inferSelect;
export type InsertMeetingNote = z.infer<typeof insertMeetingNotesSchema>;
