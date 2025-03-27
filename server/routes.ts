import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { subscribeUser, unsubscribeUser, getVapidPublicKey } from "./push-notifications";
import {
  insertGroupSchema,
  insertPrayerRequestSchema,
  insertCommentSchema,
  insertGroupMemberSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  insertOrganizationSchema,
  insertOrganizationMemberSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    // If this passes, req.user is guaranteed to be defined
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// TypeScript type guard to ensure req.user is defined
function assertUser(req: Request): asserts req is Request & { user: Express.User } {
  if (!req.user) throw new Error("User is not authenticated");
}

// Middleware to check if user has a specific role
const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

// Middleware to check if user is member of a group
const isGroupMember = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const groupId = parseInt(req.params.groupId);
  if (isNaN(groupId)) {
    return res.status(400).json({ message: "Invalid group ID" });
  }

  const membership = await storage.getGroupMember(groupId, req.user.id);
  if (!membership) {
    return res.status(403).json({ message: "You are not a member of this group" });
  }

  next();
};

// Middleware to check if user is leader of a group
const isGroupLeader = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const groupId = parseInt(req.params.groupId);
  if (isNaN(groupId)) {
    return res.status(400).json({ message: "Invalid group ID" });
  }

  const membership = await storage.getGroupMember(groupId, req.user.id);
  if (!membership || membership.role !== "leader") {
    return res.status(403).json({ message: "You are not a leader of this group" });
  }

  next();
};

// Middleware to check if user is owner of a prayer request
const isPrayerRequestOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const requestId = parseInt(req.params.requestId);
  if (isNaN(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const request = await storage.getPrayerRequest(requestId);
  if (!request) {
    return res.status(404).json({ message: "Prayer request not found" });
  }

  if (request.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "You don't have permission to modify this prayer request" });
  }

  next();
};

// Middleware to check if user is owner of a comment
const isCommentOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const commentId = parseInt(req.params.commentId);
  if (isNaN(commentId)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }

  const comment = await storage.getComment(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  if (comment.userId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "You don't have permission to modify this comment" });
  }

  next();
};

// Middleware to check if user is a member of an organization
const isOrganizationMember = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const organizationId = parseInt(req.params.organizationId);
  if (isNaN(organizationId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }

  const membership = await storage.getOrganizationMember(organizationId, req.user.id);
  if (!membership) {
    return res.status(403).json({ message: "You are not a member of this organization" });
  }

  next();
};

// Middleware to check if user is an admin of an organization
const isOrganizationAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const organizationId = parseInt(req.params.organizationId);
  if (isNaN(organizationId)) {
    return res.status(400).json({ message: "Invalid organization ID" });
  }

  const membership = await storage.getOrganizationMember(organizationId, req.user.id);
  if (!membership || membership.role !== "admin") {
    return res.status(403).json({ message: "You are not an admin of this organization" });
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Error handling middleware for Zod validation errors
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    next(err);
  });

  // Groups
  app.post("/api/groups", isAuthenticated, async (req, res, next) => {
    try {
      // Assert user is authenticated
      assertUser(req);
      
      // Validate organization membership if organizationId is provided
      if (req.body.organizationId) {
        const organizationId = parseInt(req.body.organizationId);
        const membership = await storage.getOrganizationMember(organizationId, req.user.id);
        if (!membership) {
          return res.status(403).json({ message: "You are not a member of this organization" });
        }
      }
      
      const parsedData = insertGroupSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const group = await storage.createGroup(parsedData);
      res.status(201).json(group);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/groups", isAuthenticated, async (req, res) => {
    const groups = await storage.getGroups();
    res.json(groups);
  });

  app.get("/api/groups/category/:category", isAuthenticated, async (req, res) => {
    const { category } = req.params;
    const groups = await storage.getGroupsByCategory(category);
    res.json(groups);
  });

  app.get("/api/groups/user", isAuthenticated, async (req, res) => {
    assertUser(req);
    const groups = await storage.getUserGroups(req.user.id);
    res.json(groups);
  });

  app.get("/api/groups/:groupId", isAuthenticated, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const group = await storage.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  });

  app.put("/api/groups/:groupId", isGroupLeader, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const updates = insertGroupSchema.partial().parse(req.body);
      
      const updatedGroup = await storage.updateGroup(groupId, updates);
      if (!updatedGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json(updatedGroup);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/groups/:groupId", hasRole(["admin"]), async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }

    const success = await storage.deleteGroup(groupId);
    if (!success) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(204).send();
  });

  // Group Members
  app.get("/api/groups/:groupId/members", isGroupMember, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const members = await storage.getGroupMembers(groupId);
    
    // Fetch user details for each member
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await storage.getUser(member.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        return {
          ...member,
          user: userWithoutPassword
        };
      })
    );
    
    res.json(memberDetails.filter(m => m !== null));
  });

  app.post("/api/groups/:groupId/members", isGroupLeader, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const { userId, role } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already a member
      const existingMember = await storage.getGroupMember(groupId, userId);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this group" });
      }
      
      const memberData = insertGroupMemberSchema.parse({
        groupId,
        userId,
        role: role || "member"
      });
      
      const member = await storage.addGroupMember(memberData);
      
      // Create notification for added user
      const group = await storage.getGroup(groupId);
      if (group) {
        await storage.createNotification({
          userId,
          type: "added_to_group",
          message: `You were added to the group "${group.name}"`,
          referenceId: groupId
        });
      }
      
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/groups/:groupId/members/:userId", isGroupLeader, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const updatedMember = await storage.updateGroupMember(groupId, userId, role);
    if (!updatedMember) {
      return res.status(404).json({ message: "Group member not found" });
    }
    
    res.json(updatedMember);
  });

  app.delete("/api/groups/:groupId/members/:userId", isGroupLeader, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Check if trying to remove the last leader
    const members = await storage.getGroupMembers(groupId);
    const leaders = members.filter(m => m.role === "leader");
    
    const targetMember = members.find(m => m.userId === userId);
    if (targetMember?.role === "leader" && leaders.length <= 1) {
      return res.status(400).json({ 
        message: "Cannot remove the last leader. Assign another leader first." 
      });
    }
    
    const success = await storage.removeGroupMember(groupId, userId);
    if (!success) {
      return res.status(404).json({ message: "Group member not found" });
    }
    
    res.status(204).send();
  });

  // Self-join a group
  app.post("/api/groups/:groupId/join", isAuthenticated, async (req, res) => {
    assertUser(req);
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Check if group exists
    const group = await storage.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Check if already a member
    const existingMember = await storage.getGroupMember(groupId, req.user.id);
    if (existingMember) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }
    
    // Check group privacy
    if (group.privacy !== "open") {
      return res.status(403).json({ 
        message: "This group requires an invitation or approval to join" 
      });
    }
    
    const member = await storage.addGroupMember({
      groupId,
      userId: req.user.id,
      role: "member"
    });
    
    res.status(201).json(member);
  });

  // Self-leave a group
  app.post("/api/groups/:groupId/leave", isAuthenticated, async (req, res) => {
    assertUser(req);
    const groupId = parseInt(req.params.groupId);
    if (isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid group ID" });
    }
    
    // Check if user is a member
    const membership = await storage.getGroupMember(groupId, req.user.id);
    if (!membership) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }
    
    // Check if trying to leave as the last leader
    if (membership.role === "leader") {
      const members = await storage.getGroupMembers(groupId);
      const leaders = members.filter(m => m.role === "leader");
      
      if (leaders.length <= 1) {
        return res.status(400).json({ 
          message: "You are the last leader. Assign another leader first." 
        });
      }
    }
    
    const success = await storage.removeGroupMember(groupId, req.user.id);
    if (!success) {
      return res.status(500).json({ message: "Failed to leave group" });
    }
    
    res.status(204).send();
  });

  // Prayer Requests
  app.post("/api/groups/:groupId/requests", isGroupMember, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      const requestData = insertPrayerRequestSchema.parse({
        ...req.body,
        groupId,
        userId: req.user.id
      });
      
      const request = await storage.createPrayerRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/groups/:groupId/requests", isGroupMember, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const requests = await storage.getGroupPrayerRequests(groupId);
    
    // Enrich each request with author details and comment count
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const author = await storage.getUser(request.userId);
        const comments = await storage.getPrayerRequestComments(request.id);
        const prayingCount = await storage.getPrayingForCount(request.id);
        const isPraying = await storage.isPrayingFor(request.id, req.user.id);
        
        const authorDetails = author ? {
          id: author.id,
          name: author.name,
          username: author.username
        } : null;
        
        return {
          ...request,
          author: request.isAnonymous ? null : authorDetails,
          isOwn: request.userId === req.user.id,
          commentCount: comments.length,
          prayingCount,
          isPraying
        };
      })
    );
    
    res.json(enrichedRequests);
  });

  app.get("/api/requests/:requestId", isAuthenticated, async (req, res) => {
    assertUser(req);
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    
    const request = await storage.getPrayerRequest(requestId);
    if (!request) {
      return res.status(404).json({ message: "Prayer request not found" });
    }
    
    // Check if user is member of the group
    const membership = await storage.getGroupMember(request.groupId, req.user.id);
    if (!membership && req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "You don't have permission to view this prayer request" 
      });
    }
    
    // Enrich request with author details and comment count
    const author = await storage.getUser(request.userId);
    const comments = await storage.getPrayerRequestComments(request.id);
    const prayingCount = await storage.getPrayingForCount(request.id);
    const isPraying = await storage.isPrayingFor(request.id, req.user.id);
    const group = await storage.getGroup(request.groupId);
    
    const authorDetails = author ? {
      id: author.id,
      name: author.name,
      username: author.username
    } : null;
    
    const enrichedRequest = {
      ...request,
      author: request.isAnonymous ? null : authorDetails,
      isOwn: request.userId === req.user.id,
      commentCount: comments.length,
      prayingCount,
      isPraying,
      group: group ? {
        id: group.id,
        name: group.name
      } : null
    };
    
    res.json(enrichedRequest);
  });

  app.put("/api/requests/:requestId", isPrayerRequestOwner, async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.requestId);
      
      const updates = insertPrayerRequestSchema.partial().parse(req.body);
      
      const updatedRequest = await storage.updatePrayerRequest(requestId, updates);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/requests/:requestId", isPrayerRequestOwner, async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    
    const success = await storage.deletePrayerRequest(requestId);
    if (!success) {
      return res.status(404).json({ message: "Prayer request not found" });
    }
    
    res.status(204).send();
  });

  app.get("/api/requests/user/recent", isAuthenticated, async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    
    const requests = await storage.getRecentPrayerRequests(req.user.id, limit);
    
    // Enrich each request with author details and comment count
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const author = await storage.getUser(request.userId);
        const comments = await storage.getPrayerRequestComments(request.id);
        const group = await storage.getGroup(request.groupId);
        
        const authorDetails = author ? {
          id: author.id,
          name: author.name,
          username: author.username
        } : null;
        
        return {
          ...request,
          author: request.isAnonymous ? null : authorDetails,
          isOwn: request.userId === req.user.id,
          commentCount: comments.length,
          group: group ? {
            id: group.id,
            name: group.name
          } : null
        };
      })
    );
    
    res.json(enrichedRequests);
  });

  // Comments
  app.post("/api/requests/:requestId/comments", isAuthenticated, async (req, res, next) => {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      // Check if request exists
      const request = await storage.getPrayerRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      // Check if user is member of the group
      const membership = await storage.getGroupMember(request.groupId, req.user.id);
      if (!membership && req.user.role !== "admin") {
        return res.status(403).json({ 
          message: "You don't have permission to comment on this prayer request" 
        });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        prayerRequestId: requestId,
        userId: req.user.id
      });
      
      const comment = await storage.createComment(commentData);
      
      // Enrich comment with author details
      const author = await storage.getUser(comment.userId);
      const enrichedComment = {
        ...comment,
        author: {
          id: author!.id,
          name: author!.name,
          username: author!.username
        },
        isOwn: true
      };
      
      res.status(201).json(enrichedComment);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/requests/:requestId/comments", isAuthenticated, async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    
    // Check if request exists
    const request = await storage.getPrayerRequest(requestId);
    if (!request) {
      return res.status(404).json({ message: "Prayer request not found" });
    }
    
    // Check if user is member of the group
    const membership = await storage.getGroupMember(request.groupId, req.user.id);
    if (!membership && req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "You don't have permission to view comments on this prayer request" 
      });
    }
    
    const comments = await storage.getPrayerRequestComments(requestId);
    
    // Filter out private comments if not the request owner
    const filteredComments = comments.filter(comment => 
      !comment.isPrivate || request.userId === req.user.id || comment.userId === req.user.id
    );
    
    // Enrich each comment with author details
    const enrichedComments = await Promise.all(
      filteredComments.map(async (comment) => {
        const author = await storage.getUser(comment.userId);
        
        return {
          ...comment,
          author: {
            id: author!.id,
            name: author!.name,
            username: author!.username
          },
          isOwn: comment.userId === req.user.id
        };
      })
    );
    
    res.json(enrichedComments);
  });

  app.delete("/api/comments/:commentId", isCommentOwner, async (req, res) => {
    const commentId = parseInt(req.params.commentId);
    
    const success = await storage.deleteComment(commentId);
    if (!success) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    res.status(204).send();
  });

  // Notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    const notifications = await storage.getUserNotifications(req.user.id);
    res.json(notifications);
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const notification = await storage.markNotificationRead(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json(notification);
  });

  app.patch("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    await storage.markAllNotificationsRead(req.user.id);
    res.status(204).send();
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }
    
    const success = await storage.deleteNotification(notificationId);
    if (!success) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.status(204).send();
  });

  // Praying for
  app.post("/api/requests/:requestId/pray", isAuthenticated, async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    
    // Check if request exists
    const request = await storage.getPrayerRequest(requestId);
    if (!request) {
      return res.status(404).json({ message: "Prayer request not found" });
    }
    
    // Check if user is already praying for this request
    const alreadyPraying = await storage.isPrayingFor(requestId, req.user.id);
    if (alreadyPraying) {
      return res.status(400).json({ message: "You are already praying for this request" });
    }
    
    const prayingFor = await storage.addPrayingFor({
      prayerRequestId: requestId,
      userId: req.user.id
    });
    
    const count = await storage.getPrayingForCount(requestId);
    
    res.status(201).json({ 
      prayingFor, 
      count 
    });
  });

  app.delete("/api/requests/:requestId/pray", isAuthenticated, async (req, res) => {
    const requestId = parseInt(req.params.requestId);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    
    // Check if user is praying for this request
    const isPraying = await storage.isPrayingFor(requestId, req.user.id);
    if (!isPraying) {
      return res.status(400).json({ message: "You are not praying for this request" });
    }
    
    const success = await storage.removePrayingFor(requestId, req.user.id);
    if (!success) {
      return res.status(500).json({ message: "Failed to remove prayer" });
    }
    
    const count = await storage.getPrayingForCount(requestId);
    
    res.json({ success, count });
  });

  // User profile routes
  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    const { name, email, bio } = req.body;
    
    // Validate inputs
    if (typeof name !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ message: "Invalid input data" });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    try {
      // For now, we only update user's name and email since the User schema doesn't have a bio field
      const updatedUser = await storage.updateUser(req.user.id, { 
        name: name.trim(),
        email: email.trim()
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user profile" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "An error occurred while updating your profile" });
    }
  });
  
  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ message: "Invalid input data" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }
    
    try {
      // First verify the current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isPasswordCorrect = await comparePasswords(currentPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the password
      const updatedUser = await storage.updateUser(req.user.id, { 
        password: hashedPassword
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "An error occurred while changing your password" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", hasRole(["admin"]), async (req, res) => {
    const users = await Promise.all(
      Array.from(Array(100).keys()) // Limit to first 100 users
        .map(id => storage.getUser(id + 1))
    );
    
    const validUsers = users.filter((user): user is NonNullable<typeof user> => 
      user !== undefined
    ).map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(validUsers);
  });

  app.patch("/api/admin/users/:userId/role", hasRole(["admin"]), async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const { role } = req.body;
    if (!role || !["regular", "leader", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    const updatedUser = await storage.updateUserRole(userId, role);
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  });

  // Organization routes
  app.post("/api/organizations", isAuthenticated, async (req, res, next) => {
    try {
      assertUser(req);
      
      const parsedData = insertOrganizationSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const organization = await storage.createOrganization(parsedData);
      res.status(201).json(organization);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/organizations", isAuthenticated, async (req, res) => {
    assertUser(req);
    const organizations = await storage.getUserOrganizations(req.user.id);
    res.json(organizations);
  });
  
  // Keep the original route for backward compatibility
  app.get("/api/organizations/user", isAuthenticated, async (req, res) => {
    assertUser(req);
    const organizations = await storage.getUserOrganizations(req.user.id);
    res.json(organizations);
  });

  app.get("/api/organizations/:organizationId", isOrganizationMember, async (req, res) => {
    const organizationId = parseInt(req.params.organizationId);
    const organization = await storage.getOrganization(organizationId);
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    res.json(organization);
  });

  app.patch("/api/organizations/:organizationId", isOrganizationAdmin, async (req, res, next) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const updates = insertOrganizationSchema.partial().parse(req.body);
      
      const updatedOrganization = await storage.updateOrganization(organizationId, updates);
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrganization);
    } catch (error) {
      next(error);
    }
  });
  
  // Keep PUT for backward compatibility
  app.put("/api/organizations/:organizationId", isOrganizationAdmin, async (req, res, next) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const updates = insertOrganizationSchema.partial().parse(req.body);
      
      const updatedOrganization = await storage.updateOrganization(organizationId, updates);
      if (!updatedOrganization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrganization);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/organizations/:organizationId", isOrganizationAdmin, async (req, res) => {
    const organizationId = parseInt(req.params.organizationId);
    
    const success = await storage.deleteOrganization(organizationId);
    if (!success) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    res.status(204).send();
  });

  // Organization Members
  app.get("/api/organizations/members", isAuthenticated, async (req, res) => {
    assertUser(req);
    const currentOrgId = parseInt(req.query.organizationId as string);
    
    if (!currentOrgId || isNaN(currentOrgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }
    
    // Check if user is a member of this organization
    const membership = await storage.getOrganizationMember(currentOrgId, req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }
    
    const members = await storage.getOrganizationMembers(currentOrgId);
    
    // Fetch user details for each member
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await storage.getUser(member.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        return {
          ...member,
          user: userWithoutPassword
        };
      })
    );
    
    res.json(memberDetails.filter(m => m !== null));
  });
  
  app.get("/api/organizations/:organizationId/members", isOrganizationMember, async (req, res) => {
    const organizationId = parseInt(req.params.organizationId);
    const members = await storage.getOrganizationMembers(organizationId);
    
    // Fetch user details for each member
    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await storage.getUser(member.userId);
        if (!user) return null;
        
        const { password, ...userWithoutPassword } = user;
        return {
          ...member,
          user: userWithoutPassword
        };
      })
    );
    
    res.json(memberDetails.filter(m => m !== null));
  });

  app.post("/api/organizations/:organizationId/members", isOrganizationAdmin, async (req, res, next) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const { userId, role } = req.body;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already a member
      const existingMember = await storage.getOrganizationMember(organizationId, userId);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this organization" });
      }
      
      const memberData = insertOrganizationMemberSchema.parse({
        organizationId,
        userId,
        role: role || "member"
      });
      
      const member = await storage.addOrganizationMember(memberData);
      
      // Create notification for added user
      const organization = await storage.getOrganization(organizationId);
      if (organization) {
        await storage.createNotification({
          userId,
          type: "added_to_organization",
          message: `You were added to the organization "${organization.name}"`,
          referenceId: organizationId
        });
      }
      
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });
  
  // Invite a user to an organization by email
  app.post("/api/organizations/:organizationId/invite", isOrganizationAdmin, async (req, res, next) => {
    try {
      assertUser(req);
      const organizationId = parseInt(req.params.organizationId);
      const { email, role = "member" } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user with email exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User with this email not found" });
      }
      
      // Check if already a member
      const existingMember = await storage.getOrganizationMember(organizationId, user.id);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this organization" });
      }
      
      const memberData = insertOrganizationMemberSchema.parse({
        organizationId,
        userId: user.id,
        role: role
      });
      
      const member = await storage.addOrganizationMember(memberData);
      
      // Create notification for invited user
      const organization = await storage.getOrganization(organizationId);
      if (organization) {
        await storage.createNotification({
          userId: user.id,
          type: "invited_to_organization",
          message: `You were invited to join the organization "${organization.name}"`,
          referenceId: organizationId
        });
      }
      
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/organizations/:organizationId/members/:userId", isOrganizationAdmin, async (req, res) => {
    const organizationId = parseInt(req.params.organizationId);
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Prevent removing the last admin
    if (role !== "admin") {
      const members = await storage.getOrganizationMembers(organizationId);
      const admins = members.filter(m => m.role === "admin");
      
      const targetMember = members.find(m => m.userId === userId);
      if (targetMember?.role === "admin" && admins.length <= 1) {
        return res.status(400).json({ 
          message: "Cannot demote the last admin. Promote another member first."
        });
      }
    }
    
    const updatedMember = await storage.updateOrganizationMember(organizationId, userId, role);
    if (!updatedMember) {
      return res.status(404).json({ message: "Organization member not found" });
    }
    
    res.json(updatedMember);
  });

  app.delete("/api/organizations/:organizationId/members/:userId", isOrganizationAdmin, async (req, res) => {
    const organizationId = parseInt(req.params.organizationId);
    const userId = parseInt(req.params.userId);
    assertUser(req);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Prevent removing the last admin
    const members = await storage.getOrganizationMembers(organizationId);
    const admins = members.filter(m => m.role === "admin");
    
    const targetMember = members.find(m => m.userId === userId);
    if (targetMember?.role === "admin" && admins.length <= 1) {
      return res.status(400).json({ 
        message: "Cannot remove the last admin. Promote another member first."
      });
    }
    
    // Prevent removing self if last admin
    if (userId === req.user.id && targetMember?.role === "admin" && admins.length <= 1) {
      return res.status(400).json({ 
        message: "You are the last admin. Promote another member first."
      });
    }
    
    const success = await storage.removeOrganizationMember(organizationId, userId);
    if (!success) {
      return res.status(404).json({ message: "Organization member not found" });
    }
    
    res.status(204).send();
  });

  // Organization Groups
  app.get("/api/organizations/groups", isAuthenticated, async (req, res) => {
    assertUser(req);
    const currentOrgId = parseInt(req.query.organizationId as string);
    
    if (!currentOrgId || isNaN(currentOrgId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }
    
    // Check if user is a member of this organization
    const membership = await storage.getOrganizationMember(currentOrgId, req.user.id);
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }
    
    const groups = await storage.getGroupsByOrganization(currentOrgId);
    res.json(groups);
  });
  
  app.get("/api/organizations/:organizationId/groups", isOrganizationMember, async (req, res) => {
    const organizationId = parseInt(req.params.organizationId);
    const groups = await storage.getGroupsByOrganization(organizationId);
    res.json(groups);
  });

  // Self-leave an organization
  app.post("/api/organizations/:organizationId/leave", isAuthenticated, async (req, res) => {
    assertUser(req);
    const organizationId = parseInt(req.params.organizationId);
    
    // Check if user is a member
    const membership = await storage.getOrganizationMember(organizationId, req.user.id);
    if (!membership) {
      return res.status(400).json({ message: "You are not a member of this organization" });
    }
    
    // Check if trying to leave as the last admin
    if (membership.role === "admin") {
      const members = await storage.getOrganizationMembers(organizationId);
      const admins = members.filter(m => m.role === "admin");
      
      if (admins.length <= 1) {
        return res.status(400).json({ 
          message: "You are the last admin. Promote another member first."
        });
      }
    }
    
    const success = await storage.removeOrganizationMember(organizationId, req.user.id);
    if (!success) {
      return res.status(500).json({ message: "Failed to leave organization" });
    }
    
    res.status(204).send();
  });

  // Push notification routes
  app.get("/api/push/vapid-public-key", getVapidPublicKey);
  app.post("/api/push/subscribe", isAuthenticated, subscribeUser);
  app.post("/api/push/unsubscribe", isAuthenticated, unsubscribeUser);

  // Password reset routes
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      let resetToken = null;
      
      if (user) {
        // Create password reset token
        resetToken = await storage.createPasswordResetToken(user.id);
        console.log(`Password reset token for ${user.email}: ${resetToken.token}`);
      }
      
      // In a real-world application, send an email with the reset link
      // For now, we'll just return the token in the response for testing
      // This would normally be sent via email with a link like:
      // https://yourapp.com/reset-password?token=resetToken.token
      
      // Return success regardless if user found or not for security reasons
      // During development, include the token in the response for testing
      res.status(200).json({ 
        message: "If your email is registered, you will receive a password reset link shortly",
        // Remove this in production! This is just for testing
        debug: {
          email,
          userFound: !!user,
          token: resetToken ? resetToken.token : null
        }
      });
      
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      // Find valid token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ 
          message: "Invalid or expired reset token" 
        });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);
      
      res.status(200).json({ 
        message: "Password has been reset successfully" 
      });
      
    } catch (error) {
      next(error);
    }
  });

  // Notification Preferences routes
  app.get("/api/notification-preferences", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      
      const preferences = await storage.getUserNotificationPreferences(req.user.id);
      
      if (!preferences) {
        // Create default preferences if none exist
        const newPreferences = await storage.createNotificationPreferences({
          userId: req.user.id,
          emailNotifications: true,
          pushNotifications: true,
          inAppNotifications: true,
          prayerRequests: true,
          groupInvitations: true,
          comments: true,
          statusUpdates: true,
          groupUpdates: true,
          stalePrayerReminders: true,
          reminderInterval: 7
        });
        return res.status(200).json(newPreferences);
      }
      
      res.status(200).json(preferences);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/notification-preferences", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      
      // Get existing preferences
      let preferences = await storage.getUserNotificationPreferences(req.user.id);
      
      if (!preferences) {
        // Create default preferences if none exist
        preferences = await storage.createNotificationPreferences({
          userId: req.user.id,
          ...req.body // Apply the requested changes
        });
        return res.status(200).json(preferences);
      }
      
      // Update existing preferences
      const updatedPreferences = await storage.updateNotificationPreferences(
        req.user.id,
        req.body
      );
      
      res.status(200).json(updatedPreferences);
    } catch (error) {
      next(error);
    }
  });

  // Group Notification Preferences routes
  app.get("/api/groups/:groupId/notification-preferences", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      
      const { groupId } = req.params;
      const groupIdNum = parseInt(groupId, 10);
      
      if (isNaN(groupIdNum)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      // Check if the user is a member of the group
      const membership = await storage.getGroupMember(groupIdNum, req.user.id);
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      const preferences = await storage.getGroupNotificationPreferences(req.user.id, groupIdNum);
      
      if (!preferences) {
        // Create default preferences if none exist
        const newPreferences = await storage.createGroupNotificationPreferences({
          userId: req.user.id,
          groupId: groupIdNum,
          muted: false,
          newPrayerRequests: true,
          prayerStatusUpdates: true,
          newComments: true,
          groupUpdates: true,
          meetingReminders: true
        });
        return res.status(200).json(newPreferences);
      }
      
      res.status(200).json(preferences);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/groups/:groupId/notification-preferences", isAuthenticated, async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
      
      const { groupId } = req.params;
      const groupIdNum = parseInt(groupId, 10);
      
      if (isNaN(groupIdNum)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      // Check if the user is a member of the group
      const membership = await storage.getGroupMember(groupIdNum, req.user.id);
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of this group" });
      }
      
      // Get existing preferences
      let preferences = await storage.getGroupNotificationPreferences(req.user.id, groupIdNum);
      
      if (!preferences) {
        // Create default preferences if none exist
        preferences = await storage.createGroupNotificationPreferences({
          userId: req.user.id,
          groupId: groupIdNum,
          ...req.body // Apply the requested changes
        });
        return res.status(200).json(preferences);
      }
      
      // Update existing preferences
      const updatedPreferences = await storage.updateGroupNotificationPreferences(
        req.user.id,
        groupIdNum,
        req.body
      );
      
      res.status(200).json(updatedPreferences);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
