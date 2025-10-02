// SIMPLE NOTIFICATION SYSTEM - No Firebase/APNs needed!
// This works with Expo's built-in push service for development and testing

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class SimpleNotificationService {
  private isInitialized = false;
  // Prevent multiple concurrent permission requests which can trigger
  // duplicate system dialogs and confusing outcomes in the UI.
  private _permissionRequest: Promise<boolean> | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Check if device supports notifications
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return false;
      }

      // Request permissions (use centralized method that dedupes)
      const granted = await this.requestPermissions();

      if (!granted) {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Configure Android notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      this.isInitialized = true;
      console.log('Simple notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Don't fail completely in Expo Go - local notifications still work
      this.isInitialized = true;
      return true;
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    await Notifications.setNotificationChannelAsync('water_reminders', {
      name: 'Water Reminders',
      description: 'Gentle nudges for your plant care schedule',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });

    await Notifications.setNotificationChannelAsync('health_insights', {
      name: 'Health Insights',
      description: 'Weekly summaries about plant health trends',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10B981',
    });
  }

  // Schedule a water reminder (LOCAL notification - works immediately!)
  async scheduleWaterReminder(
    plantName: string,
    frequencyDays: number
  ): Promise<string> {
    const notificationId = `water_${Date.now()}`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Time to water your plant!',
        body: `${plantName} needs watering. Check your care schedule for details.`,
        data: { type: 'water_reminder', plantName },
        sound: 'default',
      },
      trigger: { type: 'timeInterval', seconds: frequencyDays * 24 * 60 * 60, repeats: true } as any,
    } as any);
    
    console.log(`💧 Scheduled water reminder for ${plantName} every ${frequencyDays} days`);
    return notificationId;
  }

  // Schedule a health insight (LOCAL notification - works immediately!)
  async scheduleHealthInsight(
    plantName: string,
    daysFromNow: number = 7
  ): Promise<string> {
    const notificationId = `health_${Date.now()}`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Health insights ready!',
        body: `Your weekly health summary for ${plantName} is available.`,
        data: { type: 'health_insight', plantName },
        sound: 'default',
      },
      trigger: { type: 'timeInterval', seconds: daysFromNow * 24 * 60 * 60 } as any,
    } as any);
    
    console.log(`📊 Scheduled health insight for ${plantName} in ${daysFromNow} days`);
    return notificationId;
  }

  // Send a test notification (LOCAL notification - works immediately!)
  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from MyPlantScan',
        data: { type: 'general' },
        sound: 'default',
      },
      trigger: { type: 'timeInterval', seconds: 2 } as any,
    } as any);
    console.log('🧪 Test notification scheduled (2 seconds)');
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🔕 Cancelled all scheduled notifications');
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Request permissions with deduplication
  async requestPermissions(): Promise<boolean> {
    // If a request is already in progress, return the same promise
    if (this._permissionRequest) {
      return this._permissionRequest;
    }

    this._permissionRequest = (async () => {
      try {
        // Check current status first to avoid re-showing system prompt
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus === 'granted') {
          console.log('🔔 Notification permissions already granted');
          return true;
        }

        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        console.log(granted ? '🔔 Notification permissions granted' : '🔕 Notification permissions denied');
        return granted;
      } catch (error) {
        console.error('Error while requesting notification permissions:', error);
        return false;
      } finally {
        // Clear the pending promise so future requests can run
        this._permissionRequest = null;
      }
    })();

    return this._permissionRequest;
  }
}

// Export singleton instance
export const simpleNotificationService = new SimpleNotificationService();

// Export utility functions
export const initializeSimpleNotifications = () => simpleNotificationService.initialize();
export const scheduleSimpleWaterReminder = (plantName: string, frequencyDays: number) =>
  simpleNotificationService.scheduleWaterReminder(plantName, frequencyDays);
export const scheduleSimpleHealthInsight = (plantName: string, daysFromNow?: number) =>
  simpleNotificationService.scheduleHealthInsight(plantName, daysFromNow);
export const sendSimpleTestNotification = () => simpleNotificationService.sendTestNotification();
export const cancelAllSimpleNotifications = () => simpleNotificationService.cancelAllNotifications();
export const areSimpleNotificationsEnabled = () => simpleNotificationService.areNotificationsEnabled();
export const requestSimplePermissions = () => simpleNotificationService.requestPermissions();
