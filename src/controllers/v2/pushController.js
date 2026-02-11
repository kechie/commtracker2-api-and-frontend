const { PushSubscription } = require('../../db');
const { sendNotification } = require('../../utils/push');

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    // Assuming auth middleware populates req.user
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    // Check if exists
    const [subscription, created] = await PushSubscription.findOrCreate({
      where: { endpoint },
      defaults: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    if (!created) {
      // Update user if changed (e.g. different user logged in on same device)
      // or update keys if changed (unlikely for same endpoint)
      if (subscription.userId !== userId || subscription.p256dh !== keys.p256dh || subscription.auth !== keys.auth) {
        subscription.userId = userId;
        subscription.p256dh = keys.p256dh;
        subscription.auth = keys.auth;
        await subscription.save();
      }
    }

    res.status(200).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getVapidKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

exports.sendTestNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const subscriptions = await PushSubscription.findAll({ where: { userId } });

        if (subscriptions.length === 0) {
            return res.status(404).json({ message: 'No subscriptions found for user' });
        }

        const payload = JSON.stringify({
            title: 'Test Notification',
            body: 'This is a test notification from CommTracker.',
            icon: '/android-chrome-192x192.png'
        });

        const results = await Promise.all(subscriptions.map(async (sub) => {
            const result = await sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload);
            
            if (result === 'gone') {
                await sub.destroy();
                return 'removed';
            }
            return 'sent';
        }));

        res.json({ message: 'Notifications processed', results });

    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
