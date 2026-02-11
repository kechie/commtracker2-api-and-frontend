import api from './api';

const PUBLIC_KEY_URL = '/push/vapid-key';
const SUBSCRIBE_URL = '/push/subscribe';

function urlBase64ToUint8Array(base64String) {
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

export async function subscribeUserToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
        console.warn('Service worker not ready for push subscription');
        return;
    }

    // 1. Get VAPID key
    // Note: api base URL is v2, so route is /push/vapid-key
    const response = await api.get(PUBLIC_KEY_URL);
    const publicKey = response.data.publicKey;
    
    if (!publicKey) {
        throw new Error('No VAPID public key returned from server');
    }
    
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);

    // 2. Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    // 3. Send to backend
    await api.post(SUBSCRIBE_URL, {
        endpoint: subscription.endpoint,
        keys: {
            p256dh: subscription.toJSON().keys ? subscription.toJSON().keys.p256dh : null,
            auth: subscription.toJSON().keys ? subscription.toJSON().keys.auth : null
        }
    });
    
    console.log('User subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
  }
}
