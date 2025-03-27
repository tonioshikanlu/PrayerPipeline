import { 
  users, type User, type InsertUser,
  organizations, type Organization, type InsertOrganization,
  organizationMembers, type OrganizationMember, type InsertOrganizationMember,
  organizationTags, type OrganizationTag, type InsertOrganizationTag,
  groupTags, type GroupTag, type InsertGroupTag,
  groups, type Group, type InsertGroup,
  groupMembers, type GroupMember, type InsertGroupMember,
  prayerRequests, type PrayerRequest, type InsertPrayerRequest,
  comments, type Comment, type InsertComment,
  notifications, type Notification, type InsertNotification,
  prayingFor, type PrayingFor, type InsertPrayingFor,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import crypto from "crypto";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  
  // Organizations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getUserOrganizations(userId: number): Promise<Organization[]>;
  updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: number): Promise<boolean>;
  
  // Organization Members
  addOrganizationMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]>;
  getOrganizationMember(organizationId: number, userId: number): Promise<OrganizationMember | undefined>;
  updateOrganizationMember(organizationId: number, userId: number, role: string): Promise<OrganizationMember | undefined>;
  removeOrganizationMember(organizationId: number, userId: number): Promise<boolean>;
  
  // Organization Tags
  createOrganizationTag(tag: InsertOrganizationTag): Promise<OrganizationTag>;
  getOrganizationTags(organizationId: number): Promise<OrganizationTag[]>;
  getOrganizationTag(id: number): Promise<OrganizationTag | undefined>;
  updateOrganizationTag(id: number, tagData: Partial<InsertOrganizationTag>): Promise<OrganizationTag | undefined>;
  deleteOrganizationTag(id: number): Promise<boolean>;
  
  // Group Tags
  addGroupTag(groupTag: InsertGroupTag): Promise<GroupTag>;
  getGroupTags(groupId: number): Promise<GroupTag[]>;
  getGroupTagsWithDetails(groupId: number): Promise<OrganizationTag[]>;
  removeGroupTag(groupId: number, tagId: number): Promise<boolean>;
  
  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroups(): Promise<Group[]>;
  getGroupsByCategory(category: string): Promise<Group[]>;
  getGroupsByOrganization(organizationId: number): Promise<Group[]>;
  getUserGroups(userId: number): Promise<Group[]>;
  updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<boolean>;
  
  // Group Members
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined>;
  updateGroupMember(groupId: number, userId: number, role: string): Promise<GroupMember | undefined>;
  removeGroupMember(groupId: number, userId: number): Promise<boolean>;
  
  // Prayer Requests
  createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest>;
  getPrayerRequest(id: number): Promise<PrayerRequest | undefined>;
  getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]>;
  getUserPrayerRequests(userId: number): Promise<PrayerRequest[]>;
  getRecentPrayerRequests(userId: number, limit?: number): Promise<PrayerRequest[]>;
  updatePrayerRequest(id: number, request: Partial<InsertPrayerRequest>): Promise<PrayerRequest | undefined>;
  deletePrayerRequest(id: number): Promise<boolean>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getComment(id: number): Promise<Comment | undefined>;
  getPrayerRequestComments(prayerRequestId: number): Promise<Comment[]>;
  deleteComment(id: number): Promise<boolean>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Praying For
  addPrayingFor(prayingFor: InsertPrayingFor): Promise<PrayingFor>;
  removePrayingFor(prayerRequestId: number, userId: number): Promise<boolean>;
  isPrayingFor(prayerRequestId: number, userId: number): Promise<boolean>;
  getPrayingForCount(prayerRequestId: number): Promise<number>;
  
  // Password Reset
  createPasswordResetToken(userId: number): Promise<PasswordResetToken>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<PasswordResetToken | undefined>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private organizationsMap: Map<number, Organization>;
  private organizationMembersMap: Map<number, OrganizationMember>;
  private organizationTagsMap: Map<number, OrganizationTag>;
  private groupTagsMap: Map<number, GroupTag>;
  private groupsMap: Map<number, Group>;
  private groupMembersMap: Map<number, GroupMember>;
  private prayerRequestsMap: Map<number, PrayerRequest>;
  private commentsMap: Map<number, Comment>;
  private notificationsMap: Map<number, Notification>;
  private prayingForMap: Map<number, PrayingFor>;
  private passwordResetTokensMap: Map<number, PasswordResetToken>;
  
  private userIdCounter: number;
  private organizationIdCounter: number;
  private organizationMemberIdCounter: number;
  private organizationTagIdCounter: number;
  private groupTagIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private prayerRequestIdCounter: number;
  private commentIdCounter: number;
  private notificationIdCounter: number;
  private prayingForIdCounter: number;
  private passwordResetTokenIdCounter: number;
  
  sessionStore: any;

  constructor() {
    this.usersMap = new Map();
    this.organizationsMap = new Map();
    this.organizationMembersMap = new Map();
    this.organizationTagsMap = new Map();
    this.groupTagsMap = new Map();
    this.groupsMap = new Map();
    this.groupMembersMap = new Map();
    this.prayerRequestsMap = new Map();
    this.commentsMap = new Map();
    this.notificationsMap = new Map();
    this.prayingForMap = new Map();
    this.passwordResetTokensMap = new Map();
    
    this.userIdCounter = 1;
    this.organizationIdCounter = 1;
    this.organizationMemberIdCounter = 1;
    this.organizationTagIdCounter = 1;
    this.groupTagIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.prayerRequestIdCounter = 1;
    this.commentIdCounter = 1;
    this.notificationIdCounter = 1;
    this.prayingForIdCounter = 1;
    this.passwordResetTokenIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    
    // Validate role is one of the allowed values
    const validRole = insertUser.role && ["regular", "leader", "admin"].includes(insertUser.role)
      ? insertUser.role as "regular" | "leader" | "admin"
      : "regular";
    
    // Ensure all required fields have values
    const user: User = { 
      ...insertUser, 
      id,
      role: validRole
    };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    // If updating the role, validate it's a permitted value
    let validatedUserData = { ...userData };
    if (userData.role) {
      validatedUserData.role = ["regular", "leader", "admin"].includes(userData.role) 
        ? userData.role as "regular" | "leader" | "admin"
        : user.role;
    }
    
    const updatedUser = { ...user, ...validatedUserData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    // Validate role is one of the allowed values
    const validRole = ["regular", "leader", "admin"].includes(role) 
      ? role as "regular" | "leader" | "admin"
      : "regular";
    
    const updatedUser = { ...user, role: validRole };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  // Organization methods
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = this.organizationIdCounter++;
    const now = new Date();
    const organization: Organization = {
      ...insertOrg,
      id,
      createdAt: now,
      description: insertOrg.description ?? null
    };
    
    this.organizationsMap.set(id, organization);
    
    // Add creator as admin
    await this.addOrganizationMember({
      organizationId: id,
      userId: insertOrg.createdBy,
      role: "admin"
    });
    
    return organization;
  }
  
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizationsMap.get(id);
  }
  
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    // Get organizations where user is a member
    const userMemberships = Array.from(this.organizationMembersMap.values())
      .filter(member => member.userId === userId);
    
    // Get organization details for each membership
    const organizations = userMemberships
      .map(membership => this.organizationsMap.get(membership.organizationId))
      .filter((org): org is Organization => org !== undefined);
    
    return organizations;
  }
  
  async updateOrganization(id: number, orgUpdates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const organization = await this.getOrganization(id);
    if (!organization) return undefined;
    
    const updatedOrg = { ...organization, ...orgUpdates };
    this.organizationsMap.set(id, updatedOrg);
    return updatedOrg;
  }
  
  async deleteOrganization(id: number): Promise<boolean> {
    const success = this.organizationsMap.delete(id);
    
    // Clean up related data
    if (success) {
      // Delete organization members
      const orgMembers = Array.from(this.organizationMembersMap.values())
        .filter(member => member.organizationId === id);
      
      for (const member of orgMembers) {
        this.organizationMembersMap.delete(member.id);
      }
      
      // Delete groups that belong to this organization
      const orgGroups = Array.from(this.groupsMap.values())
        .filter(group => group.organizationId === id);
      
      for (const group of orgGroups) {
        await this.deleteGroup(group.id);
      }
    }
    
    return success;
  }
  
  // Organization Member methods
  async addOrganizationMember(insertMember: InsertOrganizationMember): Promise<OrganizationMember> {
    const id = this.organizationMemberIdCounter++;
    const now = new Date();
    
    // Validate role is one of the allowed values
    const validRole = insertMember.role && ["admin", "member"].includes(insertMember.role)
      ? insertMember.role as "admin" | "member"
      : "member";
    
    const member: OrganizationMember = {
      ...insertMember,
      id,
      joinedAt: now,
      role: validRole
    };
    
    this.organizationMembersMap.set(id, member);
    return member;
  }
  
  async getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]> {
    return Array.from(this.organizationMembersMap.values())
      .filter(member => member.organizationId === organizationId);
  }
  
  async getOrganizationMember(organizationId: number, userId: number): Promise<OrganizationMember | undefined> {
    return Array.from(this.organizationMembersMap.values())
      .find(member => member.organizationId === organizationId && member.userId === userId);
  }
  
  async updateOrganizationMember(organizationId: number, userId: number, role: string): Promise<OrganizationMember | undefined> {
    const member = await this.getOrganizationMember(organizationId, userId);
    if (!member) return undefined;
    
    // Validate role is one of the allowed values
    const validRole = ["admin", "member"].includes(role) 
      ? role as "admin" | "member"
      : "member";
    
    const updatedMember = { ...member, role: validRole };
    this.organizationMembersMap.set(member.id, updatedMember);
    return updatedMember;
  }
  
  async removeOrganizationMember(organizationId: number, userId: number): Promise<boolean> {
    const member = await this.getOrganizationMember(organizationId, userId);
    if (!member) return false;
    
    return this.organizationMembersMap.delete(member.id);
  }
  
  // Organization Tag methods
  async createOrganizationTag(tag: InsertOrganizationTag): Promise<OrganizationTag> {
    const id = this.organizationTagIdCounter++;
    const organizationTag: OrganizationTag = {
      ...tag,
      id
    };
    
    this.organizationTagsMap.set(id, organizationTag);
    return organizationTag;
  }
  
  async getOrganizationTags(organizationId: number): Promise<OrganizationTag[]> {
    return Array.from(this.organizationTagsMap.values())
      .filter(tag => tag.organizationId === organizationId);
  }
  
  async getOrganizationTag(id: number): Promise<OrganizationTag | undefined> {
    return this.organizationTagsMap.get(id);
  }
  
  async updateOrganizationTag(id: number, tagData: Partial<InsertOrganizationTag>): Promise<OrganizationTag | undefined> {
    const tag = await this.getOrganizationTag(id);
    if (!tag) return undefined;
    
    const updatedTag = { ...tag, ...tagData };
    this.organizationTagsMap.set(id, updatedTag);
    return updatedTag;
  }
  
  async deleteOrganizationTag(id: number): Promise<boolean> {
    // First delete all group associations with this tag
    const groupTags = Array.from(this.groupTagsMap.values())
      .filter(groupTag => groupTag.tagId === id);
    
    for (const groupTag of groupTags) {
      this.groupTagsMap.delete(groupTag.id);
    }
    
    // Then delete the tag itself
    return this.organizationTagsMap.delete(id);
  }
  
  // Group Tag methods
  async addGroupTag(groupTag: InsertGroupTag): Promise<GroupTag> {
    const id = this.groupTagIdCounter++;
    const newGroupTag: GroupTag = {
      ...groupTag,
      id
    };
    
    this.groupTagsMap.set(id, newGroupTag);
    return newGroupTag;
  }
  
  async getGroupTags(groupId: number): Promise<GroupTag[]> {
    return Array.from(this.groupTagsMap.values())
      .filter(groupTag => groupTag.groupId === groupId);
  }
  
  async getGroupTagsWithDetails(groupId: number): Promise<OrganizationTag[]> {
    // Get all tag IDs associated with this group
    const groupTagEntries = await this.getGroupTags(groupId);
    
    if (groupTagEntries.length === 0) {
      return [];
    }
    
    // Get the details of each tag
    const tagIds = groupTagEntries.map(entry => entry.tagId);
    return Array.from(this.organizationTagsMap.values())
      .filter(tag => tagIds.includes(tag.id));
  }
  
  async removeGroupTag(groupId: number, tagId: number): Promise<boolean> {
    const groupTag = Array.from(this.groupTagsMap.values())
      .find(gt => gt.groupId === groupId && gt.tagId === tagId);
      
    if (!groupTag) return false;
    
    return this.groupTagsMap.delete(groupTag.id);
  }
  
  // Group methods
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const now = new Date();
    const group: Group = { 
      ...insertGroup,
      id,
      createdAt: now,
      description: insertGroup.description ?? null,
      category: insertGroup.category || "other",
      privacy: insertGroup.privacy || "open",
      leaderRotation: insertGroup.leaderRotation ?? null
    };
    
    this.groupsMap.set(id, group);
    
    // Add creator as leader
    await this.addGroupMember({
      groupId: id,
      userId: insertGroup.createdBy,
      role: "leader" 
    });
    
    return group;
  }
  
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groupsMap.get(id);
  }
  
  async getGroups(): Promise<Group[]> {
    return Array.from(this.groupsMap.values());
  }
  
  async getGroupsByCategory(category: string): Promise<Group[]> {
    return Array.from(this.groupsMap.values())
      .filter(group => group.category === category);
  }
  
  async getGroupsByOrganization(organizationId: number): Promise<Group[]> {
    return Array.from(this.groupsMap.values())
      .filter(group => group.organizationId === organizationId);
  }
  
  async getUserGroups(userId: number): Promise<Group[]> {
    // Get groups where user is a member
    const userMemberships = Array.from(this.groupMembersMap.values())
      .filter(member => member.userId === userId);
    
    // Get group details for each membership
    const groups = userMemberships
      .map(membership => this.groupsMap.get(membership.groupId))
      .filter((group): group is Group => group !== undefined);
    
    return groups;
  }
  
  async updateGroup(id: number, groupUpdates: Partial<InsertGroup>): Promise<Group | undefined> {
    const group = await this.getGroup(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...groupUpdates };
    this.groupsMap.set(id, updatedGroup);
    return updatedGroup;
  }
  
  async deleteGroup(id: number): Promise<boolean> {
    const success = this.groupsMap.delete(id);
    
    // Clean up related data
    if (success) {
      // Delete group members
      const groupMembers = Array.from(this.groupMembersMap.values())
        .filter(member => member.groupId === id);
      
      for (const member of groupMembers) {
        this.groupMembersMap.delete(member.id);
      }
      
      // Delete prayer requests
      const requests = Array.from(this.prayerRequestsMap.values())
        .filter(request => request.groupId === id);
      
      for (const request of requests) {
        await this.deletePrayerRequest(request.id);
      }
    }
    
    return success;
  }
  
  // Group Member methods
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const now = new Date();
    
    // Validate role is one of the allowed values
    const validRole = insertMember.role && ["leader", "member"].includes(insertMember.role)
      ? insertMember.role as "leader" | "member"
      : "member";
    
    const member: GroupMember = {
      ...insertMember,
      id,
      joinedAt: now,
      role: validRole
    };
    
    this.groupMembersMap.set(id, member);
    return member;
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembersMap.values())
      .filter(member => member.groupId === groupId);
  }
  
  async getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined> {
    return Array.from(this.groupMembersMap.values())
      .find(member => member.groupId === groupId && member.userId === userId);
  }
  
  async updateGroupMember(groupId: number, userId: number, role: string): Promise<GroupMember | undefined> {
    const member = await this.getGroupMember(groupId, userId);
    if (!member) return undefined;
    
    // Validate role is one of the allowed values
    const validRole = ["leader", "member"].includes(role) 
      ? role as "leader" | "member"
      : "member";
    
    const updatedMember = { ...member, role: validRole };
    this.groupMembersMap.set(member.id, updatedMember);
    return updatedMember;
  }
  
  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    const member = await this.getGroupMember(groupId, userId);
    if (!member) return false;
    
    return this.groupMembersMap.delete(member.id);
  }
  
  // Prayer Request methods
  async createPrayerRequest(insertRequest: InsertPrayerRequest): Promise<PrayerRequest> {
    const id = this.prayerRequestIdCounter++;
    const now = new Date();
    const request: PrayerRequest = {
      ...insertRequest,
      id, 
      createdAt: now,
      updatedAt: now,
      status: insertRequest.status || "waiting",
      urgency: insertRequest.urgency || "medium",
      isAnonymous: insertRequest.isAnonymous || false
    };
    
    this.prayerRequestsMap.set(id, request);
    
    // Create notifications for group members
    const groupMembers = await this.getGroupMembers(request.groupId);
    for (const member of groupMembers) {
      // Don't notify the creator
      if (member.userId !== request.userId) {
        const group = await this.getGroup(request.groupId);
        const requester = await this.getUser(request.userId);
        if (group && requester) {
          const requesterName = request.isAnonymous ? "Anonymous" : requester.name;
          await this.createNotification({
            userId: member.userId,
            type: "new_request",
            message: `New prayer request: ${request.title} in ${group.name} by ${requesterName}`,
            referenceId: id,
          });
        }
      }
    }
    
    return request;
  }
  
  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    return this.prayerRequestsMap.get(id);
  }
  
  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return Array.from(this.prayerRequestsMap.values())
      .filter(request => request.groupId === groupId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return Array.from(this.prayerRequestsMap.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getRecentPrayerRequests(userId: number, limit = 5): Promise<PrayerRequest[]> {
    // Get groups the user is a member of
    const userGroups = await this.getUserGroups(userId);
    const groupIds = userGroups.map(group => group.id);
    
    // Get prayer requests from those groups
    const requests = Array.from(this.prayerRequestsMap.values())
      .filter(request => groupIds.includes(request.groupId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return requests;
  }
  
  async updatePrayerRequest(id: number, requestUpdates: Partial<InsertPrayerRequest>): Promise<PrayerRequest | undefined> {
    const request = await this.getPrayerRequest(id);
    if (!request) return undefined;
    
    const now = new Date();
    const updatedRequest = { 
      ...request, 
      ...requestUpdates,
      updatedAt: now 
    };
    
    this.prayerRequestsMap.set(id, updatedRequest);
    
    // If status was updated, create notification
    if (requestUpdates.status && requestUpdates.status !== request.status) {
      const requester = await this.getUser(request.userId);
      const group = await this.getGroup(request.groupId);
      
      if (requester && group) {
        // Notify group members about status update
        const groupMembers = await this.getGroupMembers(request.groupId);
        for (const member of groupMembers) {
          // No need to notify the requester if they updated their own status
          if (member.userId !== request.userId) {
            let statusText = "updated to";
            if (requestUpdates.status === "answered") statusText = "marked as answered";
            if (requestUpdates.status === "declined") statusText = "marked as declined";
            
            await this.createNotification({
              userId: member.userId,
              type: "status_update",
              message: `Prayer request "${request.title}" in ${group.name} was ${statusText}`,
              referenceId: id,
            });
          }
        }
      }
    }
    
    return updatedRequest;
  }
  
  async deletePrayerRequest(id: number): Promise<boolean> {
    const success = this.prayerRequestsMap.delete(id);
    
    // Clean up related data
    if (success) {
      // Delete comments
      const comments = Array.from(this.commentsMap.values())
        .filter(comment => comment.prayerRequestId === id);
      
      for (const comment of comments) {
        this.commentsMap.delete(comment.id);
      }
      
      // Delete "praying for" records
      const prayingForRecords = Array.from(this.prayingForMap.values())
        .filter(record => record.prayerRequestId === id);
      
      for (const record of prayingForRecords) {
        this.prayingForMap.delete(record.id);
      }
      
      // Delete notifications referencing this request
      const notifications = Array.from(this.notificationsMap.values())
        .filter(notification => notification.referenceId === id);
      
      for (const notification of notifications) {
        this.notificationsMap.delete(notification.id);
      }
    }
    
    return success;
  }
  
  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: now,
      isPrivate: insertComment.isPrivate || false
    };
    
    this.commentsMap.set(id, comment);
    
    // Create notification for prayer request owner
    const request = await this.getPrayerRequest(insertComment.prayerRequestId);
    if (request && request.userId !== insertComment.userId) {
      const commenter = await this.getUser(insertComment.userId);
      if (commenter) {
        await this.createNotification({
          userId: request.userId,
          type: "new_comment",
          message: `${commenter.name} commented on your prayer request "${request.title}"`,
          referenceId: insertComment.prayerRequestId,
        });
      }
    }
    
    return comment;
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    return this.commentsMap.get(id);
  }
  
  async getPrayerRequestComments(prayerRequestId: number): Promise<Comment[]> {
    return Array.from(this.commentsMap.values())
      .filter(comment => comment.prayerRequestId === prayerRequestId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async deleteComment(id: number): Promise<boolean> {
    const success = this.commentsMap.delete(id);
    
    // Clean up notifications related to this comment
    if (success) {
      const notifications = Array.from(this.notificationsMap.values())
        .filter(notification => 
          notification.type === "new_comment" && 
          notification.referenceId === id
        );
      
      for (const notification of notifications) {
        this.notificationsMap.delete(notification.id);
      }
    }
    
    return success;
  }
  
  // Notification methods
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const notification: Notification = {
      ...insertNotification,
      id,
      read: false,
      createdAt: now,
      referenceId: insertNotification.referenceId ?? null
    };
    
    this.notificationsMap.set(id, notification);
    return notification;
  }
  
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notificationsMap.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const notification = this.notificationsMap.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notificationsMap.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsRead(userId: number): Promise<boolean> {
    const userNotifications = await this.getUserNotifications(userId);
    
    for (const notification of userNotifications) {
      const updatedNotification = { ...notification, read: true };
      this.notificationsMap.set(notification.id, updatedNotification);
    }
    
    return true;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    return this.notificationsMap.delete(id);
  }
  
  // Praying For methods
  async addPrayingFor(insertPrayingFor: InsertPrayingFor): Promise<PrayingFor> {
    const id = this.prayingForIdCounter++;
    const now = new Date();
    const prayingFor: PrayingFor = {
      ...insertPrayingFor,
      id,
      timestamp: now,
    };
    
    this.prayingForMap.set(id, prayingFor);
    return prayingFor;
  }
  
  async removePrayingFor(prayerRequestId: number, userId: number): Promise<boolean> {
    const record = Array.from(this.prayingForMap.values())
      .find(p => p.prayerRequestId === prayerRequestId && p.userId === userId);
    
    if (!record) return false;
    
    return this.prayingForMap.delete(record.id);
  }
  
  async isPrayingFor(prayerRequestId: number, userId: number): Promise<boolean> {
    return Array.from(this.prayingForMap.values())
      .some(p => p.prayerRequestId === prayerRequestId && p.userId === userId);
  }
  
  async getPrayingForCount(prayerRequestId: number): Promise<number> {
    return Array.from(this.prayingForMap.values())
      .filter(p => p.prayerRequestId === prayerRequestId)
      .length;
  }
  
  // Password Reset methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email === email,
    );
  }
  
  async createPasswordResetToken(userId: number): Promise<PasswordResetToken> {
    const id = this.passwordResetTokenIdCounter++;
    const now = new Date();
    // Generate a random token
    const buffer = crypto.randomBytes(32);
    const token = buffer.toString('hex');
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
    
    const resetToken: PasswordResetToken = {
      id,
      userId,
      token,
      expiresAt,
      isUsed: false,
      createdAt: now
    };
    
    this.passwordResetTokensMap.set(id, resetToken);
    return resetToken;
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    return Array.from(this.passwordResetTokensMap.values()).find(
      (resetToken) => resetToken.token === token && !resetToken.isUsed && resetToken.expiresAt > new Date()
    );
  }
  
  async markPasswordResetTokenUsed(id: number): Promise<PasswordResetToken | undefined> {
    const token = this.passwordResetTokensMap.get(id);
    if (!token) return undefined;
    
    const updatedToken = { ...token, isUsed: true };
    this.passwordResetTokensMap.set(id, updatedToken);
    return updatedToken;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Session store setup
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL as string,
        ssl: { rejectUnauthorized: false }
      },
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Validate role is one of the allowed values
    const validRole = insertUser.role && ["regular", "leader", "admin"].includes(insertUser.role)
      ? insertUser.role as "regular" | "leader" | "admin"
      : "regular";
    
    const userToInsert = {
      ...insertUser,
      role: validRole
    };
    
    const result = await db.insert(users).values(userToInsert).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    // If updating the role, validate it's a permitted value
    let validatedUserData = { ...userData };
    if (userData.role) {
      validatedUserData.role = ["regular", "leader", "admin"].includes(userData.role) 
        ? userData.role as "regular" | "leader" | "admin"
        : userData.role;
    }
    
    const result = await db.update(users)
      .set(validatedUserData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    // Validate role is one of the allowed values
    const validRole = ["regular", "leader", "admin"].includes(role) 
      ? role as "regular" | "leader" | "admin"
      : "regular";
    
    const result = await db.update(users)
      .set({ role: validRole })
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  // Organization methods
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations)
      .values({
        name: insertOrg.name,
        description: insertOrg.description,
        createdBy: insertOrg.createdBy,
      })
      .returning();
    
    const org = result[0];
    
    // Add creator as admin
    await this.addOrganizationMember({
      organizationId: org.id,
      userId: org.createdBy,
      role: "admin"
    });
    
    return org;
  }
  
  async getOrganization(id: number): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }
  
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    // Get organization memberships for the user
    const memberships = await db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId));
    
    if (memberships.length === 0) {
      return [];
    }
    
    // Get organizations for these memberships
    const orgIds = memberships.map(m => m.organizationId);
    return await db.select()
      .from(organizations)
      .where(sql`${organizations.id} IN (${orgIds.join(', ')})`);
  }
  
  async updateOrganization(id: number, orgUpdates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const result = await db.update(organizations)
      .set(orgUpdates)
      .where(eq(organizations.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteOrganization(id: number): Promise<boolean> {
    // Delete organization members
    await db.delete(organizationMembers)
      .where(eq(organizationMembers.organizationId, id));
    
    // Find groups in this organization
    const orgGroups = await db.select()
      .from(groups)
      .where(eq(groups.organizationId, id));
    
    // Delete each group
    for (const group of orgGroups) {
      await this.deleteGroup(group.id);
    }
    
    // Delete the organization
    const result = await db.delete(organizations)
      .where(eq(organizations.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Organization Member methods
  async addOrganizationMember(insertMember: InsertOrganizationMember): Promise<OrganizationMember> {
    // Validate role is one of the allowed values
    const validRole = insertMember.role && ["admin", "member"].includes(insertMember.role)
      ? insertMember.role as "admin" | "member"
      : "member";
    
    const result = await db.insert(organizationMembers)
      .values({
        organizationId: insertMember.organizationId,
        userId: insertMember.userId,
        role: validRole,
      })
      .returning();
    
    return result[0];
  }
  
  async getOrganizationMembers(organizationId: number): Promise<OrganizationMember[]> {
    return await db.select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
  }
  
  async getOrganizationMember(organizationId: number, userId: number): Promise<OrganizationMember | undefined> {
    const result = await db.select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId)
        )
      );
    
    return result[0];
  }
  
  async updateOrganizationMember(organizationId: number, userId: number, role: string): Promise<OrganizationMember | undefined> {
    // Validate role is one of the allowed values
    const validRole = ["admin", "member"].includes(role) 
      ? role as "admin" | "member"
      : "member";
    
    const result = await db.update(organizationMembers)
      .set({ role: validRole })
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId)
        )
      )
      .returning();
    
    return result[0];
  }
  
  async removeOrganizationMember(organizationId: number, userId: number): Promise<boolean> {
    const result = await db.delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId)
        )
      )
      .returning();
    
    return result.length > 0;
  }
  
  // Organization Tag methods
  async createOrganizationTag(tag: InsertOrganizationTag): Promise<OrganizationTag> {
    const [newTag] = await db.insert(organizationTags)
      .values(tag)
      .returning();
    return newTag;
  }
  
  async getOrganizationTags(organizationId: number): Promise<OrganizationTag[]> {
    return db.select()
      .from(organizationTags)
      .where(eq(organizationTags.organizationId, organizationId));
  }
  
  async getOrganizationTag(id: number): Promise<OrganizationTag | undefined> {
    const [tag] = await db.select()
      .from(organizationTags)
      .where(eq(organizationTags.id, id));
    return tag;
  }
  
  async updateOrganizationTag(id: number, tagData: Partial<InsertOrganizationTag>): Promise<OrganizationTag | undefined> {
    const [updatedTag] = await db.update(organizationTags)
      .set(tagData)
      .where(eq(organizationTags.id, id))
      .returning();
    return updatedTag;
  }
  
  async deleteOrganizationTag(id: number): Promise<boolean> {
    // First delete all group associations with this tag
    await db.delete(groupTags)
      .where(eq(groupTags.tagId, id));
      
    // Then delete the tag itself
    const result = await db.delete(organizationTags)
      .where(eq(organizationTags.id, id))
      .returning();
    return result.length > 0;
  }
  
  // Group Tag methods
  async addGroupTag(groupTag: InsertGroupTag): Promise<GroupTag> {
    const [newGroupTag] = await db.insert(groupTags)
      .values(groupTag)
      .returning();
    return newGroupTag;
  }
  
  async getGroupTags(groupId: number): Promise<GroupTag[]> {
    return db.select()
      .from(groupTags)
      .where(eq(groupTags.groupId, groupId));
  }
  
  async getGroupTagsWithDetails(groupId: number): Promise<OrganizationTag[]> {
    // Get all tag IDs associated with this group
    const groupTagEntries = await this.getGroupTags(groupId);
    
    if (groupTagEntries.length === 0) {
      return [];
    }
    
    // Get the details of each tag
    const tagIds = groupTagEntries.map(entry => entry.tagId);
    return db.select()
      .from(organizationTags)
      .where(sql`${organizationTags.id} IN (${tagIds.join(',')})`);
  }
  
  async removeGroupTag(groupId: number, tagId: number): Promise<boolean> {
    const result = await db.delete(groupTags)
      .where(and(
        eq(groupTags.groupId, groupId),
        eq(groupTags.tagId, tagId)
      ))
      .returning();
    return result.length > 0;
  }
  
  // Group methods
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const now = new Date();
    const groupToInsert = {
      ...insertGroup,
      createdAt: now,
      description: insertGroup.description ?? null,
      category: insertGroup.category || "other",
      privacy: insertGroup.privacy || "open",
      leaderRotation: insertGroup.leaderRotation ?? null
    };
    
    const result = await db.insert(groups).values(groupToInsert).returning();
    const group = result[0];
    
    // Add creator as leader
    await this.addGroupMember({
      groupId: group.id,
      userId: insertGroup.createdBy,
      role: "leader" 
    });
    
    return group;
  }
  
  async getGroup(id: number): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.id, id));
    return result[0];
  }
  
  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }
  
  async getGroupsByCategory(category: string): Promise<Group[]> {
    return await db.select()
      .from(groups)
      .where(sql`${groups.category} = ${category}`);
  }
  
  async getGroupsByOrganization(organizationId: number): Promise<Group[]> {
    return await db.select()
      .from(groups)
      .where(eq(groups.organizationId, organizationId));
  }
  
  async getUserGroups(userId: number): Promise<Group[]> {
    // Join group_members and groups tables to get user's groups
    const result = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        createdAt: groups.createdAt,
        createdBy: groups.createdBy,
        organizationId: groups.organizationId,
        privacy: groups.privacy,
        category: groups.category,
        leaderRotation: groups.leaderRotation
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId));
    
    return result;
  }
  
  async updateGroup(id: number, groupUpdates: Partial<InsertGroup>): Promise<Group | undefined> {
    const result = await db.update(groups)
      .set(groupUpdates)
      .where(eq(groups.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteGroup(id: number): Promise<boolean> {
    try {
      // Start a transaction to ensure all related records are deleted
      await db.transaction(async (tx) => {
        // Delete related records in proper order to respect foreign keys
        
        // 1. First delete comments on prayer requests in this group
        const groupRequests = await tx.select({ id: prayerRequests.id })
          .from(prayerRequests)
          .where(eq(prayerRequests.groupId, id));
        
        const requestIds = groupRequests.map((r: { id: number }) => r.id);
        
        if (requestIds.length > 0) {
          // Delete comments
          await tx.delete(comments)
            .where(sql`${comments.prayerRequestId} IN (${sql.join(requestIds)})`);
          
          // Delete praying for records
          await tx.delete(prayingFor)
            .where(sql`${prayingFor.prayerRequestId} IN (${sql.join(requestIds)})`);
          
          // Delete notifications referring to these requests
          await tx.delete(notifications)
            .where(sql`${notifications.referenceId} IN (${sql.join(requestIds)})`);
          
          // Delete prayer requests
          await tx.delete(prayerRequests)
            .where(eq(prayerRequests.groupId, id));
        }
        
        // 2. Delete group members
        await tx.delete(groupMembers)
          .where(eq(groupMembers.groupId, id));
        
        // 3. Finally delete the group
        await tx.delete(groups)
          .where(eq(groups.id, id));
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting group:", error);
      return false;
    }
  }
  
  // Group Member methods
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const now = new Date();
    
    // Validate role is one of the allowed values
    const validRole = insertMember.role && ["leader", "member"].includes(insertMember.role)
      ? insertMember.role as "leader" | "member"
      : "member";
    
    const memberToInsert = {
      ...insertMember,
      joinedAt: now,
      role: validRole
    };
    
    const result = await db.insert(groupMembers).values(memberToInsert).returning();
    return result[0];
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db.select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
  }
  
  async getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined> {
    const result = await db.select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      );
    
    return result[0];
  }
  
  async updateGroupMember(groupId: number, userId: number, role: string): Promise<GroupMember | undefined> {
    // Validate role is one of the allowed values
    const validRole = ["leader", "member"].includes(role) 
      ? role as "leader" | "member"
      : "member";
    
    const result = await db.update(groupMembers)
      .set({ role: validRole })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .returning();
    
    return result[0];
  }
  
  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    try {
      await db.delete(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
          )
        );
      
      return true;
    } catch (error) {
      console.error("Error removing group member:", error);
      return false;
    }
  }
  
  // Prayer Request methods
  async createPrayerRequest(insertRequest: InsertPrayerRequest): Promise<PrayerRequest> {
    const now = new Date();
    const requestToInsert = {
      ...insertRequest,
      createdAt: now,
      updatedAt: now,
      status: insertRequest.status || "waiting",
      urgency: insertRequest.urgency || "medium",
      isAnonymous: insertRequest.isAnonymous || false
    };
    
    const result = await db.insert(prayerRequests).values(requestToInsert).returning();
    const request = result[0];
    
    // Create notifications for group members
    const groupMembers = await this.getGroupMembers(request.groupId);
    for (const member of groupMembers) {
      // Don't notify the creator
      if (member.userId !== request.userId) {
        const group = await this.getGroup(request.groupId);
        const requester = await this.getUser(request.userId);
        if (group && requester) {
          const requesterName = request.isAnonymous ? "Anonymous" : requester.name;
          await this.createNotification({
            userId: member.userId,
            type: "new_request",
            message: `New prayer request: ${request.title} in ${group.name} by ${requesterName}`,
            referenceId: request.id,
          });
        }
      }
    }
    
    return request;
  }
  
  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    const result = await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.id, id));
    
    return result[0];
  }
  
  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.groupId, groupId))
      .orderBy(desc(prayerRequests.createdAt));
  }
  
  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.userId, userId))
      .orderBy(desc(prayerRequests.createdAt));
  }
  
  async getRecentPrayerRequests(userId: number, limit = 5): Promise<PrayerRequest[]> {
    // Get groups the user is a member of
    const userGroups = await this.getUserGroups(userId);
    const groupIds = userGroups.map(group => group.id);
    
    if (groupIds.length === 0) {
      return [];
    }
    
    // Get prayer requests from those groups
    const requests = await db.select()
      .from(prayerRequests)
      .where(sql`${prayerRequests.groupId} IN (${sql.join(groupIds)})`)
      .orderBy(desc(prayerRequests.createdAt))
      .limit(limit);
    
    return requests;
  }
  
  async updatePrayerRequest(id: number, requestUpdates: Partial<InsertPrayerRequest>): Promise<PrayerRequest | undefined> {
    const now = new Date();
    const updates = {
      ...requestUpdates,
      updatedAt: now
    };
    
    const result = await db.update(prayerRequests)
      .set(updates)
      .where(eq(prayerRequests.id, id))
      .returning();
    
    const updatedRequest = result[0];
    
    // If status was updated, create notification
    if (requestUpdates.status) {
      const request = await this.getPrayerRequest(id);
      if (request && requestUpdates.status !== request.status) {
        const requester = await this.getUser(request.userId);
        const group = await this.getGroup(request.groupId);
        
        if (requester && group) {
          // Notify group members about status update
          const groupMembers = await this.getGroupMembers(request.groupId);
          for (const member of groupMembers) {
            // No need to notify the requester if they updated their own status
            if (member.userId !== request.userId) {
              let statusText = "updated to";
              if (requestUpdates.status === "answered") statusText = "marked as answered";
              if (requestUpdates.status === "declined") statusText = "marked as declined";
              
              await this.createNotification({
                userId: member.userId,
                type: "status_update",
                message: `Prayer request "${request.title}" in ${group.name} was ${statusText}`,
                referenceId: id,
              });
            }
          }
        }
      }
    }
    
    return updatedRequest;
  }
  
  async deletePrayerRequest(id: number): Promise<boolean> {
    try {
      // Start a transaction to delete prayer request and related records
      await db.transaction(async (tx) => {
        // Delete comments
        await tx.delete(comments)
          .where(eq(comments.prayerRequestId, id));
        
        // Delete praying for records
        await tx.delete(prayingFor)
          .where(eq(prayingFor.prayerRequestId, id));
        
        // Delete notifications
        await tx.delete(notifications)
          .where(eq(notifications.referenceId, id));
        
        // Delete the prayer request
        await tx.delete(prayerRequests)
          .where(eq(prayerRequests.id, id));
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      return false;
    }
  }
  
  // Comment methods
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const now = new Date();
    const commentToInsert = {
      ...insertComment,
      createdAt: now,
      isPrivate: insertComment.isPrivate || false
    };
    
    const result = await db.insert(comments).values(commentToInsert).returning();
    const comment = result[0];
    
    // Create notification for prayer request owner
    const request = await this.getPrayerRequest(comment.prayerRequestId);
    if (request && request.userId !== comment.userId) {
      const commenter = await this.getUser(comment.userId);
      if (commenter) {
        await this.createNotification({
          userId: request.userId,
          type: "new_comment",
          message: `${commenter.name} commented on your prayer request "${request.title}"`,
          referenceId: comment.prayerRequestId,
        });
      }
    }
    
    return comment;
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    const result = await db.select()
      .from(comments)
      .where(eq(comments.id, id));
    
    return result[0];
  }
  
  async getPrayerRequestComments(prayerRequestId: number): Promise<Comment[]> {
    return await db.select()
      .from(comments)
      .where(eq(comments.prayerRequestId, prayerRequestId))
      .orderBy(comments.createdAt);
  }
  
  async deleteComment(id: number): Promise<boolean> {
    try {
      await db.delete(comments)
        .where(eq(comments.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  }
  
  // Notifications
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const now = new Date();
    const notificationToInsert = {
      ...insertNotification,
      createdAt: now,
      read: false
    };
    
    const result = await db.insert(notifications).values(notificationToInsert).returning();
    return result[0];
  }
  
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return result[0];
  }
  
  async markAllNotificationsRead(userId: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    try {
      await db.delete(notifications)
        .where(eq(notifications.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }
  
  // Praying For
  async addPrayingFor(insertPrayingFor: InsertPrayingFor): Promise<PrayingFor> {
    const now = new Date();
    const prayingForToInsert = {
      ...insertPrayingFor,
      createdAt: now
    };
    
    const result = await db.insert(prayingFor).values(prayingForToInsert).returning();
    return result[0];
  }
  
  async removePrayingFor(prayerRequestId: number, userId: number): Promise<boolean> {
    try {
      await db.delete(prayingFor)
        .where(
          and(
            eq(prayingFor.prayerRequestId, prayerRequestId),
            eq(prayingFor.userId, userId)
          )
        );
      
      return true;
    } catch (error) {
      console.error("Error removing praying for record:", error);
      return false;
    }
  }
  
  async isPrayingFor(prayerRequestId: number, userId: number): Promise<boolean> {
    const result = await db.select()
      .from(prayingFor)
      .where(
        and(
          eq(prayingFor.prayerRequestId, prayerRequestId),
          eq(prayingFor.userId, userId)
        )
      );
    
    return result.length > 0;
  }
  
  async getPrayingForCount(prayerRequestId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(prayingFor)
      .where(eq(prayingFor.prayerRequestId, prayerRequestId));
    
    return result[0]?.count || 0;
  }
  
  // Password Reset methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, email));
    
    return result[0];
  }
  
  async createPasswordResetToken(userId: number): Promise<PasswordResetToken> {
    const now = new Date();
    // Generate a random token
    const buffer = crypto.randomBytes(32);
    const token = buffer.toString('hex');
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
    
    const tokenToInsert: InsertPasswordResetToken = {
      userId,
      token,
      expiresAt
    };
    
    const result = await db.insert(passwordResetTokens)
      .values(tokenToInsert)
      .returning();
    
    return result[0];
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const now = new Date();
    
    const result = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.isUsed, false),
          sql`${passwordResetTokens.expiresAt} > ${now}`
        )
      );
    
    return result[0];
  }
  
  async markPasswordResetTokenUsed(id: number): Promise<PasswordResetToken | undefined> {
    const result = await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.id, id))
      .returning();
    
    return result[0];
  }
}

// Use PostgreSQL database if DATABASE_URL is available, otherwise use in-memory storage
const useDatabase = process.env.DATABASE_URL !== undefined && process.env.USE_DATABASE !== 'false';
export const storage = useDatabase ? new DatabaseStorage() : new MemStorage();
