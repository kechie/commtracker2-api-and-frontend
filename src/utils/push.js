const webpush = require('web-push');
require('dotenv').config();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

if (!publicKey || !privateKey) {
  console.warn('VAPID keys are missing. Push notifications will not work.');
} else {
  webpush.setVapidDetails(
    email,
    publicKey,
    privateKey
  );
}

/**
 * Send a push notification to a subscription.
 * @param {object} subscription - The subscription object (must have endpoint and keys).
 * @param {object|string} payload - The data to send.
 */
const sendNotification = async (subscription, payload) => {
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    await webpush.sendNotification(subscription, payloadString);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    // 410 Gone means the subscription is no longer valid
    if (error.statusCode === 410) {
      return 'gone';
    }
    // Don't throw for other errors, just log and continue
    return false;
  }
};

/**
 * Notify specific users about tracker events.
 * @param {Array} userIds - Array of user IDs to notify.
 * @param {object} tracker - The tracker instance.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body.
 * @param {string} url - Redirection URL.
 * @param {string} senderId - ID of user who triggered the event (to exclude).
 */
const notifyUsers = async (userIds, title, body, url, senderId = null) => {
  if (!userIds || userIds.length === 0) return;

  try {
    const { PushSubscription } = require('../db');

    // Filter out sender
    const targetUserIds = senderId ? userIds.filter(id => id !== senderId) : userIds;
    if (targetUserIds.length === 0) return;

    const subscriptions = await PushSubscription.findAll({
      where: {
        userId: targetUserIds
      }
    });

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      url
    });

    await Promise.all(subscriptions.map(async (sub) => {
      const result = await sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload);

      if (result === 'gone') {
        await sub.destroy();
      }
    }));
  } catch (error) {
    console.error('Notify users error:', error);
  }
};

/**
 * Notify recipients about tracker events.
 * @param {object} tracker - The tracker instance.
 * @param {Array} recipientIds - Array of recipient IDs to notify.
 * @param {string} action - Action type (CREATE, UPDATE, etc).
 * @param {string} senderId - ID of user who triggered the event (to exclude).
 */
const notifyRecipients = async (tracker, recipientIds, action = 'CREATE', senderId = null) => {
  if (!recipientIds || recipientIds.length === 0) return;

  try {
    // Lazy load db to avoid circular dependencies
    const { User } = require('../db');

    // Find all users associated with these recipients
    const users = await User.findAll({
      where: {
        recipientId: recipientIds
      },
      attributes: ['id', 'recipientId']
    });

    if (users.length === 0) return;

    const title = action === 'CREATE' ? 'New Document Tracker' : 'Updated Document Tracker';
    const body = `${tracker.serialNumber || 'No Serial'}: ${tracker.documentTitle || 'Untitled'}`;

    // Group users by recipientId to provide correct URL for each
    const usersByRecipient = users.reduce((acc, user) => {
      if (!acc[user.recipientId]) acc[user.recipientId] = [];
      acc[user.recipientId].push(user.id);
      return acc;
    }, {});

    for (const recipientId of Object.keys(usersByRecipient)) {
      const userIds = usersByRecipient[recipientId];
      const url = `/recipients/${recipientId}/trackers/${tracker.id}`;
      await notifyUsers(userIds, title, body, url, senderId);
    }
  } catch (error) {
    console.error('Notify recipients error:', error);
  }
};

/**
 * Notify users with specific roles.
 * @param {Array} roles - Array of roles to notify.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body.
 * @param {string} url - Redirection URL.
 * @param {string} senderId - ID of user who triggered the event (to exclude).
 */
const notifyRoles = async (roles, title, body, url, senderId = null) => {
  if (!roles || roles.length === 0) return;

  try {
    const { User } = require('../db');
    const users = await User.findAll({
      where: {
        role: roles
      },
      attributes: ['id']
    });

    if (users.length === 0) return;

    const userIds = users.map(u => u.id);
    await notifyUsers(userIds, title, body, url, senderId);
  } catch (error) {
    console.error('Notify roles error:', error);
  }
};

module.exports = {
  webpush,
  sendNotification,
  notifyUsers,
  notifyRecipients,
  notifyRoles
};
