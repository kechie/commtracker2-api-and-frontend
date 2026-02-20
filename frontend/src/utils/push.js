import api from './api';

const PUBLIC_KEY_URL = '/push/vapid-key';
const SUBSCRIBE_URL = '/push/subscribe';

function urlBase64ToUint8Array(base64String) {
  try {
    if (!base64String || typeof base64String !== 'string') {
        throw new Error('VAPID public key must be a string');
    }
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (error) {
    console.error('Error converting VAPID key to Uint8Array:', error);
    throw error;
  }
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Use exact path from public
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.warn('Service workers are not supported');
  }
}

let isSubscribing = false;

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return;
  }

  if (isSubscribing) {
    console.log('Push subscription already in progress, skipping...');
    return;
  }

  isSubscribing = true;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
        console.warn('Service worker not ready for push subscription');
        isSubscribing = false;
        return;
    }

    // Ensure service worker is up to date
    try {
      await registration.update();
    } catch (e) {
      console.warn('Service worker update failed (non-critical):', e);
    }

    // 1. Get VAPID key
    const response = await api.get(PUBLIC_KEY_URL);
    const publicKey = response.data.publicKey;
    console.log('VAPID public key received:', publicKey);
    
    if (!publicKey) {
        throw new Error('No VAPID public key returned from server');
    }
    
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);
    console.log('Converted VAPID key length:', convertedVapidKey.byteLength);
    
    if (convertedVapidKey.byteLength !== 65) {
      console.warn('VAPID public key length is not 65 bytes. This might cause issues in some browsers.');
    }

    // 2. Check for existing subscription
    const existingSubscription = await registration.pushManager.getSubscription({
      applicationServerKey: convertedVapidKey
    });
    
    // Check permission
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted. Skipping automatic subscription.');
      isSubscribing = false;
      return;
    }

    if (existingSubscription) {
      console.log('Existing subscription found:', existingSubscription);
      try {
        await existingSubscription.unsubscribe();
        console.log('Unsubscribed from existing subscription');
      } catch (e) {
        console.warn('Failed to unsubscribe from existing subscription (non-critical):', e);
      }
    }

    // 3. Subscribe
    console.log('Attempting to subscribe to push...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
    console.log('Subscription successful:', subscription);

    // 4. Send to backend
    await api.post(SUBSCRIBE_URL, {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.toJSON().keys ? subscription.toJSON().keys.p256dh : null,
            auth: subscription.toJSON().keys ? subscription.toJSON().keys.auth : null
        }
    });
    
    console.log('User subscribed to push notifications and sent to backend');
    isSubscribing = false;
    return subscription;
  } catch (error) {
    isSubscribing = false;
    console.error('Failed to subscribe to push:', error);
    if (error.name === 'AbortError') {
      console.error('AbortError during push subscription. This can happen due to network issues (blocking FCM/Mozilla push services), invalid VAPID keys, or browser push service problems.');
      console.error('If you are on localhost, ensure you have a stable internet connection and no firewall/VPN is blocking push services.');
    }
  }
}
