import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export interface AlertItem {
  id: string;
  code: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  payload?: any;
}

interface AlertsContextType {
  alerts: AlertItem[];
  unreadCount: number;
  addAlert: (alert: Omit<AlertItem, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const STORAGE_KEY = 'app_alerts_v1';

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Configure notification handler to allow foreground display
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
    });

    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        // ignore
      }
    })();

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setAlerts(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      const id = data.alertId as string | undefined;
      if (id) {
        // navigate to modal for that alert
        const alert = alerts.find(a => a.id === id);
        if (alert) {
          router.push({ pathname: '/modal', params: { ...alert.payload, suspicious: 'true' } });
        }
      }
    });

    return () => subscription.remove();
  }, [router, alerts]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alerts)).catch(() => {});
  }, [alerts]);

  const addAlert = async (incoming: Omit<AlertItem, 'id' | 'createdAt' | 'read'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: AlertItem = { ...incoming, id, createdAt: Date.now(), read: false } as AlertItem;
    setAlerts(prev => [item, ...prev]);

    // show a local notification so backgrounded users get notified
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          data: { alertId: item.id },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (e) {
      // ignore
    }

    // make phone vibrate strongly
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
  };

  const markRead = async (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const removeAlert = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const value: AlertsContextType = {
    alerts,
    unreadCount: alerts.filter(a => !a.read).length,
    addAlert,
    markRead,
    removeAlert,
  };

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
};

export const useAlerts = () => {
  const c = useContext(AlertsContext);
  if (!c) throw new Error('useAlerts must be used within AlertsProvider');
  return c;
};
