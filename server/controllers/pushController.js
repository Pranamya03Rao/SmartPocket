import { env } from '../config/env.js';
import PushSubscription from '../models/PushSubscription.js';
import { sendPushToUser, sendPushToUsers, broadcast } from '../services/pushService.js';

export function getVapidPublicKey(req, res) {
  // Public endpoint: returns ONLY the public key
  res.json({ publicKey: env.VAPID_PUBLIC_KEY || '' });
}

export async function subscribe(req, res, next) {
  try {
    const { endpoint, keys, expirationTime, userAgent } = req.validated;

    // Upsert subscription by endpoint, linking to logged-in user
    // (reassigns user if device was previously subscribed by another user)
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId: req.user._id,
        endpoint,
        keys,
        expirationTime: expirationTime || null,
        userAgent: userAgent || req.headers['user-agent'] || '',
        failureCount: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Keep at most 10 devices per user
    await PushSubscription.keepMaxSubscriptions(req.user._id, 10);

    res.status(201).json({
      message: 'Subscribed to push notifications successfully',
      subscriptionId: subscription._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.validated;

    // Delete by endpoint, only if belonging to the current user
    const deleted = await PushSubscription.findOneAndDelete({
      endpoint,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Subscription not found for this user' });
    }

    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (err) {
    next(err);
  }
}

export async function testPush(req, res, next) {
  try {
    const results = await sendPushToUser(req.user._id, {
      title: 'Smart Pocket',
      body: 'Push notifications are working properly on this device!',
      url: '/profile',
      tag: 'push-test',
    });

    res.json({
      message: 'Test notification triggered',
      devicesNotified: results.filter(r => r.status === 'fulfilled').length,
    });
  } catch (err) {
    next(err);
  }
}

export async function sendPush(req, res, next) {
  try {
    const { userId, userIds, broadcast: isBroadcast, title, body, url, tag } = req.validated;
    const payload = { title, body, url, tag };

    if (isBroadcast) {
      await broadcast(payload);
      return res.json({ message: 'Broadcast push notification sent' });
    }

    if (Array.isArray(userIds) && userIds.length > 0) {
      await sendPushToUsers(userIds, payload);
      return res.json({ message: `Push notification sent to ${userIds.length} users` });
    }

    if (userId) {
      await sendPushToUser(userId, payload);
      return res.json({ message: `Push notification sent to user ${userId}` });
    }

    return res.status(400).json({ error: 'Specify userId, userIds, or broadcast: true' });
  } catch (err) {
    next(err);
  }
}
