import { apiFetch } from '@/lib/api';

type PushPublicKeyResponse = {
  publicKey: string;
};

type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const getPushPublicKey = async (): Promise<string> => {
  const response = await apiFetch<PushPublicKeyResponse>('/api/push/public-key');
  return response.publicKey || '';
};

const savePushSubscription = async (subscription: PushSubscription): Promise<void> => {
  const subscriptionJson = subscription.toJSON();
  const payload: PushSubscriptionPayload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscriptionJson.keys?.p256dh || '',
      auth: subscriptionJson.keys?.auth || '',
    },
  };

  await apiFetch<void>('/api/push/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const enableAdminPushNotifications = async (): Promise<void> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return;
  }

  const publicKey = await getPushPublicKey();
  if (!publicKey) {
    return;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return;
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await savePushSubscription(subscription);
};

export type AdminPushStatus = {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
};

export const getAdminPushStatus = async (): Promise<AdminPushStatus> => {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) {
    return { supported: false, permission: 'unsupported', subscribed: false };
  }

  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    || await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.getSubscription();

  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
  };
};

export const sendAdminTestPush = async (): Promise<void> => {
  await apiFetch<void>('/api/push/test', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Course Compass Test',
      body: 'This is a test push notification from Admin Settings.',
    }),
  });
};