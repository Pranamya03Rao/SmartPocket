import { api } from '../api/client.js';

/**
 * Convert a base64 string to a Uint8Array for applicationServerKey
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the current context is secure (HTTPS or localhost)
 */
export function isSecureContext() {
  if (typeof window === 'undefined') return false;
  return (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );
}

/**
 * Check if the device is iOS and whether it is running in standalone PWA mode
 */
export function checkIosState() {
  if (typeof navigator === 'undefined') {
    return { isIos: false, isStandalone: false };
  }
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const isStandalone =
    ('standalone' in navigator && !!navigator.standalone) ||
    (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches);

  return { isIos, isStandalone };
}

/**
 * Check whether Web Push is supported on this browser and environment
 */
export function isPushSupported() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    isSecureContext() &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Register the Service Worker located at /sw.js
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers are not supported');
  }
  return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

/**
 * Get the current notification permission state: 'granted', 'denied', or 'default'
 */
export function getPermissionState() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

/**
 * Get detailed subscription status for UI rendering
 * States: 'unsupported' | 'blocked' | 'on' | 'off'
 */
export async function getSubscriptionStatus() {
  const { isIos, isStandalone } = checkIosState();

  if (!isSecureContext()) {
    return {
      state: 'unsupported',
      reason: 'insecure_context',
      message: 'Push notifications require a secure HTTPS connection or localhost.',
    };
  }

  if (isIos && !isStandalone) {
    return {
      state: 'unsupported',
      reason: 'ios_not_standalone',
      message: 'On iOS, web push requires adding this app to your Home Screen first.',
    };
  }

  if (!isPushSupported()) {
    return {
      state: 'unsupported',
      reason: 'not_supported',
      message: 'Push notifications are not supported by this browser.',
    };
  }

  if (Notification.permission === 'denied') {
    return {
      state: 'blocked',
      reason: 'permission_denied',
      message: 'Notifications are blocked. Please enable them in browser site settings.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      return { state: 'off' };
    }
    const subscription = await registration.pushManager.getSubscription();
    return { state: subscription ? 'on' : 'off', subscription };
  } catch (err) {
    console.error('Error getting subscription status:', err);
    return { state: 'off' };
  }
}

/**
 * Subscribe the device to push notifications (MUST be called on user gesture)
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    const { isIos, isStandalone } = checkIosState();
    if (isIos && !isStandalone) {
      throw new Error('On iOS, please add this app to your Home Screen first to enable push notifications.');
    }
    if (!isSecureContext()) {
      throw new Error('Push notifications require an HTTPS connection.');
    }
    throw new Error('Web Push is not supported in this browser.');
  }

  // 1. Request notification permission on user click
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notification permission was denied. Please allow notifications in site settings.'
        : 'Notification permission was dismissed.'
    );
  }

  // 2. Ensure service worker is registered and ready
  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  // 3. Fetch VAPID public key from API
  const res = await api.get('/push/vapid-public-key');
  const vapidPublicKey = res.data?.publicKey;
  if (!vapidPublicKey) {
    throw new Error('VAPID public key not found on server.');
  }

  // 4. Subscribe with PushManager
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  // 5. Send subscription to server
  const rawSub = subscription.toJSON();
  await api.post('/push/subscribe', {
    endpoint: rawSub.endpoint,
    keys: {
      p256dh: rawSub.keys?.p256dh,
      auth: rawSub.keys?.auth,
    },
    expirationTime: rawSub.expirationTime || null,
    userAgent: navigator.userAgent,
  });

  return subscription;
}

/**
 * Unsubscribe the current device from push notifications
 */
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const endpoint = subscription.endpoint;

    // 1. Unsubscribe from browser PushManager
    await subscription.unsubscribe();

    // 2. Inform server to delete subscription record
    await api.post('/push/unsubscribe', { endpoint }).catch(() => {});

    return true;
  } catch (err) {
    console.error('Error during push unsubscription:', err);
    return false;
  }
}

/**
 * Re-sync existing active subscription to link to the logged-in user
 */
export async function syncPushSubscriptionWithUser() {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return null;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return null;

    const rawSub = subscription.toJSON();
    if (!rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
      return null;
    }

    await api.post('/push/subscribe', {
      endpoint: rawSub.endpoint,
      keys: {
        p256dh: rawSub.keys.p256dh,
        auth: rawSub.keys.auth,
      },
      expirationTime: rawSub.expirationTime || null,
      userAgent: navigator.userAgent,
    });

    return subscription;
  } catch (err) {
    console.error('Failed to sync push subscription with logged-in user:', err);
    return null;
  }
}
