import webpush from 'web-push';
import { storage } from './storage';
import { Request, Response } from 'express';
import { db } from './db';
import { subscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Generate VAPID keys for web push notifications
// These should be generated only once and stored securely
// In production, these should be stored in environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BLc-Gp6TOcOkblpBXVHGHD9iqTX5tkQIBOuhk0NmM5S6v4Ym3xIhw0YWKUvAVj_2s5lNw-rIiLPEazLmIeaD87U',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'HF3isULudwZfpBfLLgj86qnUAfZtYAP1RKGCxWQmq_o'
};

// Set up web push with VAPID keys
webpush.setVapidDetails(
  'mailto:contact@prayerpipeline.app', // Change to your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Function to subscribe a user to push notifications
export async function subscribeUser(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { subscription, deviceInfo } = req.body;

  if (!subscription) {
    return res.status(400).json({ message: 'Subscription data is required' });
  }

  try {
    // Save subscription to database with user ID
    const [savedSubscription] = await db.insert(subscriptions)
      .values({
        userId: req.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: deviceInfo?.userAgent || req.headers['user-agent'] || '',
        createdAt: new Date()
      })
      .returning();

    return res.status(201).json({
      message: 'Subscription added successfully',
      id: savedSubscription.id
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return res.status(500).json({ message: 'Failed to save subscription' });
  }
}

// Function to unsubscribe a user from push notifications
export async function unsubscribeUser(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ message: 'Endpoint is required' });
  }

  try {
    // Remove subscription from database
    await db.delete(subscriptions)
      .where(eq(subscriptions.endpoint, endpoint));

    return res.status(200).json({ message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error removing subscription:', error);
    return res.status(500).json({ message: 'Failed to remove subscription' });
  }
}

// Function to send a push notification to a user
export async function sendPushNotification(userId: number, title: string, body: string, url?: string) {
  try {
    // Get all subscriptions for the user
    const userSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (!userSubscriptions.length) {
      return { success: false, message: 'No subscriptions found for user' };
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      timestamp: new Date().getTime()
    });

    // Send notification to all user's subscriptions
    const results = await Promise.allSettled(
      userSubscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }, payload);
          return { success: true, endpoint: subscription.endpoint };
        } catch (error: any) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await db.delete(subscriptions)
              .where(eq(subscriptions.endpoint, subscription.endpoint));
          }
          throw error;
        }
      })
    );

    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: successful > 0,
      message: `Sent ${successful} notifications, failed to send ${failed} notifications`
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, message: 'Failed to send push notification' };
  }
}

// Function to send group notifications for new prayer requests
export async function sendGroupNotification(groupId: number, exceptUserId: number, title: string, body: string, url?: string) {
  try {
    // Get all members of the group
    const members = await storage.getGroupMembers(groupId);
    
    // Send notification to each member except the one who triggered it
    const results = await Promise.allSettled(
      members
        .filter(member => member.userId !== exceptUserId)
        .map(member => sendPushNotification(member.userId, title, body, url))
    );

    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - successful;

    return {
      success: successful > 0,
      message: `Sent ${successful} group notifications, failed to send ${failed} notifications`
    };
  } catch (error) {
    console.error('Error sending group notification:', error);
    return { success: false, message: 'Failed to send group notification' };
  }
}

// VAPID public key getter - for the frontend to use
export function getVapidPublicKey(req: Request, res: Response) {
  res.json({ publicKey: vapidKeys.publicKey });
}