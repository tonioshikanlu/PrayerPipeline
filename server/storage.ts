import { 
  users, type User, type InsertUser,
  groups, type Group, type InsertGroup,
  groupMembers, type GroupMember, type InsertGroupMember,
  prayerRequests, type PrayerRequest, type InsertPrayerRequest,
  comments, type Comment, type InsertComment,
  notifications, type Notification, type InsertNotification,
  prayingFor, type PrayingFor, type InsertPrayingFor
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  
  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroups(): Promise<Group[]>;
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
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private groupsMap: Map<number, Group>;
  private groupMembersMap: Map<number, GroupMember>;
  private prayerRequestsMap: Map<number, PrayerRequest>;
  private commentsMap: Map<number, Comment>;
  private notificationsMap: Map<number, Notification>;
  private prayingForMap: Map<number, PrayingFor>;
  
  private userIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private prayerRequestIdCounter: number;
  private commentIdCounter: number;
  private notificationIdCounter: number;
  private prayingForIdCounter: number;
  
  sessionStore: any;

  constructor() {
    this.usersMap = new Map();
    this.groupsMap = new Map();
    this.groupMembersMap = new Map();
    this.prayerRequestsMap = new Map();
    this.commentsMap = new Map();
    this.notificationsMap = new Map();
    this.prayingForMap = new Map();
    
    this.userIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.prayerRequestIdCounter = 1;
    this.commentIdCounter = 1;
    this.notificationIdCounter = 1;
    this.prayingForIdCounter = 1;
    
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
  
  // Group methods
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const now = new Date();
    const group: Group = { 
      ...insertGroup,
      id,
      createdAt: now,
      description: insertGroup.description ?? null,
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
}

export const storage = new MemStorage();
