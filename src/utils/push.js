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
 * Notify recipients about tracker events.
 * @param {object} tracker - The tracker instance.
 * @param {Array} recipientIds - Array of recipient IDs to notify.
 * @param {string} action - Action type (CREATE, UPDATE, etc).
 */
const notifyRecipients = async (tracker, recipientIds, action = 'CREATE') => {
  if (!recipientIds || recipientIds.length === 0) return;

  try {
    // Lazy load db to avoid circular dependencies
    const { User, PushSubscription } = require('../db');

    // Find all users associated with these recipients, including their recipientId
    const users = await User.findAll({
      where: {
        recipientId: recipientIds
      },
      attributes: ['id', 'recipientId']
    });

    if (users.length === 0) return;

    // Group users by recipientId
    const usersByRecipient = users.reduce((acc, user) => {
      if (!acc[user.recipientId]) acc[user.recipientId] = [];
      acc[user.recipientId].push(user.id);
      return acc;
    }, {});

    const title = action === 'CREATE' ? 'New Document Tracker' : 'Updated Document Tracker';
    const body = `${tracker.serialNumber || 'No Serial'}: ${tracker.documentTitle || 'Untitled'}`;

    // For each recipient, find their users' subscriptions and send notifications
    for (const recipientId of Object.keys(usersByRecipient)) {
      const userIds = usersByRecipient[recipientId];
      
      const subscriptions = await PushSubscription.findAll({
        where: {
          userId: userIds
        }
      });

      if (subscriptions.length === 0) continue;

      const url = `/recipients/${recipientId}/trackers/${tracker.id}`;
      
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
    }
  } catch (error) {
    console.error('Notify recipients error:', error);
  }
};

module.exports = {
  webpush,
  sendNotification,
  notifyRecipients
};
