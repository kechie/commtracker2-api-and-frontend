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
    throw error;
  }
};

module.exports = {
  webpush,
  sendNotification
};
