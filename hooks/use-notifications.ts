import { useEffect, useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { notificationService, NotificationData } from '@/lib/notifications';
import { useSettings } from '@/providers/settings-provider';

export interface NotificationState {
  isInitialized: boolean;
  hasPermission: boolean;
  pushToken: string | null;
  isLoading: boolean;
}

export const useNotifications = () => {
  const { settings } = useSettings();
  const [state, setState] = useState<NotificationState>({
    isInitialized: false,
    hasPermission: false,
    pushToken: null,
    isLoading: true,
  });

  const initializeNotifications = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const initialized = await notificationService.initialize();
      const hasPermission = await notificationService.areNotificationsEnabled();
      const pushToken = await notificationService.getPushToken();

      setState({
        isInitialized: initialized,
        hasPermission,
        pushToken,
        isLoading: false,
      });

      return initialized;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestPermissions();
      
      if (granted) {
        const pushToken = await notificationService.getPushToken();
        setState(prev => ({
          ...prev,
          hasPermission: true,
          pushToken,
        }));
        
        // Show success message
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

  const togglePushNotifications = useCallback(async (enabled: boolean) => {
    if (enabled && !state.hasPermission) {
      // Request permissions if enabling notifications
      const granted = await requestPermissions();
      if (!granted) {
        return false; // Permission denied, don't update settings
      }
    } else if (!enabled) {
      // Cancel all notifications if disabling
      await notificationService.cancelAllNotifications();
    }
    
    return true; // Settings can be updated
  }, [state.hasPermission, requestPermissions]);

  const toggleWateringReminders = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      // Cancel all water reminders if disabling
      await notificationService.cancelAllNotifications();
    }
    return true;
  }, []);

  const toggleHealthInsights = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      // Cancel all health insights if disabling
      await notificationService.cancelAllNotifications();
    }
    return true;
  }, []);

  const scheduleWaterReminder = useCallback(async (
    plantId: string,
    plantName: string,
    scheduleId: string,
    frequencyDays: number,
    startDate?: Date
  ) => {
    if (!settings.wateringReminders || !state.hasPermission) {
      return null;
    }

    try {
      return await notificationService.scheduleWaterReminder(
        plantId,
        plantName,
        scheduleId,
        frequencyDays,
        startDate
      );
    } catch (error) {
      console.error('Failed to schedule water reminder:', error);
      return null;
    }
  }, [settings.wateringReminders, state.hasPermission]);

  const cancelWaterReminder = useCallback(async (plantId: string, scheduleId: string) => {
    try {
      await notificationService.cancelWaterReminder(plantId, scheduleId);
    } catch (error) {
      console.error('Failed to cancel water reminder:', error);
    }
  }, []);

  const scheduleHealthInsight = useCallback(async (
    plantId: string,
    plantName: string,
    scheduledDate: Date
  ) => {
    if (!settings.healthInsights || !state.hasPermission) {
      return null;
    }

    try {
      return await notificationService.scheduleHealthInsight(plantId, plantName, scheduledDate);
    } catch (error) {
      console.error('Failed to schedule health insight:', error);
      return null;
    }
  }, [settings.healthInsights, state.hasPermission]);

  const scheduleWeeklyHealthDigest = useCallback(async (scheduledDate: Date) => {
    if (!settings.healthInsights || !state.hasPermission) {
      return null;
    }

    try {
      return await notificationService.scheduleWeeklyHealthDigest(scheduledDate);
    } catch (error) {
      console.error('Failed to schedule weekly health digest:', error);
      return null;
    }
  }, [settings.healthInsights, state.hasPermission]);

  const sendTestNotification = useCallback(async () => {
    if (!state.hasPermission) {
      Alert.alert(
        'No Permission',
        'Please enable notifications in settings first.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await notificationService.sendTestNotification();
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
  }, [state.hasPermission]);

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  // Handle settings changes
  useEffect(() => {
    if (!state.isInitialized) return;

    // If notifications are disabled, cancel all
    if (!settings.pushNotifications) {
      notificationService.cancelAllNotifications();
    }
  }, [settings.pushNotifications, state.isInitialized]);

  return {
    ...state,
    initializeNotifications,
    requestPermissions,
    togglePushNotifications,
    toggleWateringReminders,
    toggleHealthInsights,
    scheduleWaterReminder,
    cancelWaterReminder,
    scheduleHealthInsight,
    scheduleWeeklyHealthDigest,
    sendTestNotification,
  };
};

