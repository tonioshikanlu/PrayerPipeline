import webpush from 'web-push';
import { storage } from './storage';
import { Request, Response } from 'express';
import { db } from './db';
import { subscriptions, PrayerReminder, pushTokens } from '@shared/schema';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';

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
    // Track results
    let webPushSuccessful = 0;
    let webPushFailed = 0;
    let expoPushSuccessful = 0;
    let expoPushFailed = 0;

    // 1. Send Web Push Notifications
    const userSubscriptions = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (userSubscriptions.length > 0) {
      // Prepare web push notification payload
      const webPushPayload = JSON.stringify({
        title,
        body,
        url: url || '/',
        timestamp: new Date().getTime()
      });

      // Send notification to all user's web push subscriptions
      const webPushResults = await Promise.allSettled(
        userSubscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
              }
            }, webPushPayload);
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

      // Count successful and failed web push notifications
      webPushSuccessful = webPushResults.filter(r => r.status === 'fulfilled').length;
      webPushFailed = webPushResults.filter(r => r.status === 'rejected').length;
    }

    // 2. Send Expo Push Notifications
    const userTokens = await db.select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (userTokens.length > 0) {
      // Prepare messages for Expo push service
      const messages = userTokens.map(tokenRecord => ({
        to: tokenRecord.token,
        sound: 'default',
        title,
        body,
        data: { url: url || '/' },
      }));

      // Send to Expo push service
      const expoPushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages)
      });

      const expoPushResult = await expoPushResponse.json() as {
        data?: { 
          status: 'ok' | 'error';
          message?: string;
        }[] 
      };
      
      if (expoPushResult.data) {
        // Count successful and failed expo push notifications
        expoPushSuccessful = expoPushResult.data.filter(item => item.status === 'ok').length;
        expoPushFailed = messages.length - expoPushSuccessful;

        // Clean up any invalid tokens
        if (expoPushResult.data.some(item => item.status === 'error')) {
          for (let i = 0; i < expoPushResult.data.length; i++) {
            const item = expoPushResult.data[i];
            if (item.status === 'error' && 
                item.message && (
                  item.message === 'DeviceNotRegistered' || 
                  item.message === 'InvalidCredentials' || 
                  item.message === 'MessageTooBig' || 
                  item.message === 'MessageRateExceeded'
                )) {
              // Remove invalid token
              await db.delete(pushTokens)
                .where(eq(pushTokens.token, messages[i].to));
            }
          }
        }
      }
    }

    const totalSuccessful = webPushSuccessful + expoPushSuccessful;
    const totalFailed = webPushFailed + expoPushFailed;
    const totalAttempted = totalSuccessful + totalFailed;

    if (totalAttempted === 0) {
      return { success: false, message: 'No push notification subscriptions found for user' };
    }

    return {
      success: totalSuccessful > 0,
      message: `Sent ${totalSuccessful} notifications (${webPushSuccessful} web, ${expoPushSuccessful} mobile), failed to send ${totalFailed} notifications`,
      web: { successful: webPushSuccessful, failed: webPushFailed },
      expo: { successful: expoPushSuccessful, failed: expoPushFailed }
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

// Function to register an Expo push token
export async function registerPushToken(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { token, deviceType } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Push token is required' });
  }

  try {
    // Check if token already exists
    const existingToken = await db.select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token))
      .limit(1);

    if (existingToken.length > 0) {
      // Update last used time
      await db.update(pushTokens)
        .set({ 
          lastUsed: new Date(),
          userId: req.user.id, // Update user ID in case token was transferred between accounts
          deviceType: deviceType || existingToken[0].deviceType 
        })
        .where(eq(pushTokens.token, token));

      return res.status(200).json({ 
        message: 'Push token updated successfully',
        id: existingToken[0].id
      });
    }

    // Save new token to database with user ID
    const [savedToken] = await db.insert(pushTokens)
      .values({
        userId: req.user.id,
        token,
        deviceType: deviceType || 'unknown',
        createdAt: new Date(),
        lastUsed: new Date()
      })
      .returning();

    return res.status(201).json({
      message: 'Push token registered successfully',
      id: savedToken.id
    });
  } catch (error) {
    console.error('Error registering push token:', error);
    return res.status(500).json({ message: 'Failed to register push token' });
  }
}

// Function to unregister an Expo push token
export async function unregisterPushToken(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Push token is required' });
  }

  try {
    // Remove token from database
    await db.delete(pushTokens)
      .where(eq(pushTokens.token, token));

    return res.status(200).json({ message: 'Push token removed successfully' });
  } catch (error) {
    console.error('Error removing push token:', error);
    return res.status(500).json({ message: 'Failed to remove push token' });
  }
}

// Function to schedule a prayer reminder notification
export async function schedulePrayerReminderNotification(userId: number, reminder: PrayerReminder): Promise<boolean> {
  try {
    // Convert time string to Date object for today
    const now = new Date();
    const reminderTimeStr = reminder.reminderTime.toString(); // "HH:MM:SS"
    const [hours, minutes] = reminderTimeStr.split(':').map(Number);
    
    let targetDate = new Date(now);
    targetDate.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (targetDate.getTime() < now.getTime()) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    // Check if this is a recurring reminder and if it should be scheduled today
    if (reminder.isRecurring && reminder.recurringDays) {
      const recurringDays = JSON.parse(reminder.recurringDays) as string[];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = dayNames[targetDate.getDay()].toLowerCase();
      
      // If today is not in the recurring days, find the next valid day
      if (!recurringDays.includes(currentDayName)) {
        let daysToAdd = 1;
        let nextDayName = dayNames[(targetDate.getDay() + daysToAdd) % 7].toLowerCase();
        
        // Find the next valid day
        while (!recurringDays.includes(nextDayName) && daysToAdd < 7) {
          daysToAdd++;
          nextDayName = dayNames[(targetDate.getDay() + daysToAdd) % 7].toLowerCase();
        }
        
        // Adjust the target date to the next valid day
        targetDate.setDate(targetDate.getDate() + daysToAdd);
      }
    }
    
    // Check if the reminder is still active (activeUntil not passed)
    if (reminder.activeUntil && new Date(reminder.activeUntil) < targetDate) {
      return false; // Don't schedule if the reminder has expired
    }
    
    // Calculate milliseconds until the notification should be sent
    const timeUntilNotification = targetDate.getTime() - now.getTime();
    
    // Schedule the notification
    setTimeout(() => {
      sendPushNotification(
        userId,
        reminder.title,
        reminder.description || 'Time to pray!',
        '/prayer-requests'
      ).catch(err => console.error('Error sending prayer reminder notification:', err));
    }, timeUntilNotification);
    
    console.log(`Prayer reminder "${reminder.title}" scheduled for ${targetDate.toLocaleString()} (in ${Math.round(timeUntilNotification / 60000)} minutes)`);
    
    return true;
  } catch (error) {
    console.error('Error scheduling prayer reminder notification:', error);
    return false;
  }
}