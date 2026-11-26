import * as webpush from 'web-push';
import { env } from '../config/env.js';
import PushSubscription from '../models/PushSubscription.js';

let vapidConfigured = false;

export function configureVapidDetails() {
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        env.VAPID_SUBJECT || 'mailto:admin@smartpocket.org',
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY
      );
      vapidConfigured = true;
    } catch (err) {
      console.error('Failed to configure VAPID details:', err.message);
    }
  }
}

// Initial setup
configureVapidDetails();

/**
 * Format and sanitize payload
 */
function formatPayload(payload = {}) {
  const url = typeof payload.url === 'string' && payload.url.startsWith('/')
    ? payload.url
    : '/';

  return JSON.stringify({
    title: payload.title || 'Smart Pocket',
    body: payload.body || '',
    icon: payload.icon || '/vite.svg',
    url,
    tag: payload.tag || 'smart-pocket-notification',
  });
}

/**
 * Deliver push notification to an array of subscription documents
 */
async function sendToSubscriptions(subscriptions, payload) {
  if (!subscriptions || subscriptions.length === 0) return [];

  if (!vapidConfigured) {
    configureVapidDetails();
  }

  const payloadString = formatPayload(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payloadString
        );

        if (sub.failureCount > 0) {
          await PushSubscription.updateOne({ _id: sub._id }, { $set: { failureCount: 0 } }).catch(() => {});
        }
        return { success: true, id: sub._id };
      } catch (err) {
        const statusCode = err.statusCode || err.status;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
        } else {
          const nextCount = (sub.failureCount || 0) + 1;
          if (nextCount >= 5) {
            await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
          } else {
            await PushSubscription.updateOne(
              { _id: sub._id },
              { $set: { failureCount: nextCount } }
            ).catch(() => {});
          }
        }
        throw err;
      }
    })
  );

  return results;
}

/**
 * Send push notification to a single user's devices
 */
export async function sendPushToUser(userId, payload) {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    return await sendToSubscriptions(subscriptions, payload);
  } catch (err) {
    console.error(`Error sending push to user ${userId}:`, err.message);
    return [];
  }
}

/**
 * Send push notification to multiple users' devices
 */
export async function sendPushToUsers(userIds, payload) {
  try {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];
    const subscriptions = await PushSubscription.find({ userId: { $in: userIds } });
    return await sendToSubscriptions(subscriptions, payload);
  } catch (err) {
    console.error('Error sending push to users:', err.message);
    return [];
  }
}

/**
 * Broadcast push notification to all subscribed devices
 */
export async function broadcast(payload) {
  try {
    const subscriptions = await PushSubscription.find({});
    return await sendToSubscriptions(subscriptions, payload);
  } catch (err) {
    console.error('Error broadcasting push:', err.message);
    return [];
  }
}
