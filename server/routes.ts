import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  insertGroupSchema,
  insertPrayerRequestSchema,
  insertCommentSchema,
  insertGroupMemberSchema,
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
const assertUser = (req: Request): asserts req is Request & { user: Express.User } => {
  if (!req.user) throw new Error("User is not authenticated");
};

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

  app.get("/api/groups/user", isAuthenticated, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
