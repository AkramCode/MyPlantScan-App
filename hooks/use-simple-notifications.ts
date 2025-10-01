// SIMPLE NOTIFICATION HOOK - No Firebase/APNs needed!
import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  simpleNotificationService, 
  initializeSimpleNotifications,
  scheduleSimpleWaterReminder,
  scheduleSimpleHealthInsight,
  sendSimpleTestNotification,
  cancelAllSimpleNotifications,
  areSimpleNotificationsEnabled,
  requestSimplePermissions
} from '@/lib/simple-notifications';
import { useSettings } from '@/providers/settings-provider';

export const useSimpleNotifications = () => {
  const { settings } = useSettings();
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeNotifications = useCallback(async () => {
    try {
      const initialized = await initializeSimpleNotifications();
      const hasPermission = await areSimpleNotificationsEnabled();
      
      setIsInitialized(initialized);
      setHasPermission(hasPermission);
      
      return initialized;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      // Don't fail completely in Expo Go - local notifications still work
      setIsInitialized(true);
      setHasPermission(false);
      return true;
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestSimplePermissions();
      setHasPermission(granted);
      
      if (granted) {
        Alert.alert(
          'Notifications Enabled',
          'You\'ll now receive helpful reminders about your plants!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'You can enable notifications later in your device settings.',
          [{ text: 'OK' }]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      Alert.alert(
        'Error',
        'Failed to request notification permissions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, []);

  const scheduleWaterReminder = useCallback(async (
    plantName: string,
    frequencyDays: number
  ) => {
    if (!settings.wateringReminders || !hasPermission) {
      return null;
    }

    try {
      return await scheduleSimpleWaterReminder(plantName, frequencyDays);
    } catch (error) {
      console.error('Failed to schedule water reminder:', error);
      return null;
    }
  }, [settings.wateringReminders, hasPermission]);

  const scheduleHealthInsight = useCallback(async (
    plantName: string,
    daysFromNow: number = 7
  ) => {
    if (!settings.healthInsights || !hasPermission) {
      return null;
    }

    try {
      return await scheduleSimpleHealthInsight(plantName, daysFromNow);
    } catch (error) {
      console.error('Failed to schedule health insight:', error);
      return null;
    }
  }, [settings.healthInsights, hasPermission]);

  const sendTestNotification = useCallback(async () => {
    if (!hasPermission) {
      Alert.alert(
        'No Permission',
        'Please enable notifications in settings first.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await sendSimpleTestNotification();
      Alert.alert(
        'Test Sent',
        'A test notification should appear in 2 seconds.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert(
        'Error',
        'Failed to send test notification. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [hasPermission]);

  const togglePushNotifications = useCallback(async (enabled: boolean) => {
    console.log(enabled ? '🔔 Enabling push notifications...' : '🔕 Disabling push notifications...');
    
    if (enabled && !hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        console.log('❌ Failed to get notification permissions');
        return false;
      }
    } else if (!enabled) {
      await cancelAllSimpleNotifications();
    }
    
    console.log(enabled ? '✅ Push notifications enabled' : '✅ Push notifications disabled');
    return true;
  }, [hasPermission, requestPermissions]);

  const toggleWateringReminders = useCallback(async (enabled: boolean) => {
    console.log(enabled ? '💧 Enabling watering reminders...' : '💧 Disabling watering reminders...');
    
    if (!enabled) {
      await cancelAllSimpleNotifications();
    }
    
    console.log(enabled ? '✅ Watering reminders enabled' : '✅ Watering reminders disabled');
    return true;
  }, []);

  const toggleHealthInsights = useCallback(async (enabled: boolean) => {
    console.log(enabled ? '📊 Enabling health insights...' : '📊 Disabling health insights...');
    
    if (!enabled) {
      await cancelAllSimpleNotifications();
    }
    
    console.log(enabled ? '✅ Health insights enabled' : '✅ Health insights disabled');
    return true;
  }, []);

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  return {
    isInitialized,
    hasPermission,
    initializeNotifications,
    requestPermissions,
    scheduleWaterReminder,
    scheduleHealthInsight,
    sendTestNotification,
    togglePushNotifications,
    toggleWateringReminders,
    toggleHealthInsights,
  };
};
