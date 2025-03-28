import { z } from 'zod';

// Types mirroring the backend schema
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

// Zod schemas
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().default("regular"),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

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

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export interface Organization {
  id: number;
  name: string;
  description?: string;
  website?: string;
  memberCount: number;
  isAdmin: boolean;
  joinedAt: string;
}

export interface OrganizationInvite {
  id: number;
  organizationId: number;
  organizationName: string;
  invitedByName: string;
  invitedAt: string;
  status: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  organizationId: number;
  organizationName: string;
  category: string;
  privacy: string;
  memberCount: number;
  requestCount: number;
  isLeader: boolean;
  isMember: boolean;
  createdAt: string;
}

export interface PrayerRequest {
  id: number;
  groupId: number;
  groupName: string;
  userId: number;
  userName: string;
  isOwnRequest: boolean;
  title: string;
  description: string;
  urgency: string;
  isAnonymous: boolean;
  status: string;
  followUpDate?: string;
  commentCount: number;
  prayingCount: number;
  hasPrayed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  prayerRequestId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  isOwnComment: boolean;
  text: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  referenceId?: number;
  referenceType?: string;
  referenceUrl?: string;
  createdAt: string;
}

export interface Meeting {
  id: number;
  groupId: number;
  groupName: string;
  title: string;
  description?: string;
  meetingType: string;
  meetingLink: string;
  startTime: string;
  endTime?: string;
  isRecurring: boolean;
  recurringPattern?: string;
  recurringDay?: number;
  recurringUntil?: string;
  createdBy: number;
  createdByName: string;
  isCreator: boolean;
  createdAt: string;
}

export interface MeetingNote {
  id: number;
  meetingId: number;
  content: string;
  summary?: string;
  createdAt: string;
  isAiGenerated: boolean;
}

export interface PushTokenRegistration {
  token: string;
  deviceType: 'ios' | 'android' | 'web';
}