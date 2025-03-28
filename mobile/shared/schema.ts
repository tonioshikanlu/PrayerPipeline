import { z } from 'zod';

// Define the User schema
export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string().default('regular'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

// Define the insert user schema
export const InsertUserSchema = UserSchema.omit({ id: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Login schema
export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Register schema
export const RegisterSchema = InsertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ForgotPassword schema
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// ResetPassword schema
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type InsertUser = z.infer<typeof InsertUserSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

// Organization schema
export const OrganizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().or(z.date()),
  createdBy: z.number(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// PrayerRequest schema
export const PrayerRequestSchema = z.object({
  id: z.number(),
  groupId: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string(),
  urgency: z.string(),
  isAnonymous: z.boolean(),
  status: z.string(),
  followUpDate: z.string().or(z.date()).optional(),
  isStale: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type PrayerRequest = z.infer<typeof PrayerRequestSchema>;

// Group schema
export const GroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  organizationId: z.number(),
  category: z.string(),
  privacy: z.string(),
  leaderRotation: z.number(),
  createdAt: z.string().or(z.date()),
  createdBy: z.number(),
});

export type Group = z.infer<typeof GroupSchema>;

// Comment schema
export const CommentSchema = z.object({
  id: z.number(),
  prayerRequestId: z.number(),
  userId: z.number(),
  text: z.string(),
  isPrivate: z.boolean(),
  createdAt: z.string().or(z.date()),
});

export type Comment = z.infer<typeof CommentSchema>;