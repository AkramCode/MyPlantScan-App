import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Newer API fields
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

export interface NotificationData {
  type: 'water_reminder' | 'health_insight' | 'general';
  plantId?: string;
  plantName?: string;
  scheduleId?: string;
  [key: string]: any;
}

// scheduleNotificationAsync expects { content, trigger }

class NotificationService {
  private pushToken: string | null = null;
  private isInitialized = false;

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

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        // Remove projectId requirement for Expo managed workflow
      });
      this.pushToken = tokenData.data;

      // Configure Android notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
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

  private setupNotificationListeners(): void {
    // Handle notifications received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // You can add custom handling here if needed
    });

    // Handle notification taps
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    if (!data || typeof data !== 'object') {
      return;
    }

    const notificationData = data as NotificationData;

    switch (notificationData.type) {
      case 'water_reminder':
        if (notificationData.plantId) {
          router.push(`/plant-details?id=${notificationData.plantId}`);
        } else {
          router.push('/(tabs)/garden');
        }
        break;
      
      case 'health_insight':
        router.push('/(tabs)/health');
        break;
      
      case 'general':
      default:
        router.push('/(tabs)');
        break;
    }
  }

  async getPushToken(): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.pushToken;
  }

  async scheduleWaterReminder(
    plantId: string,
    plantName: string,
    scheduleId: string,
    frequencyDays: number,
    startDate: Date = new Date()
  ): Promise<string> {
    const notificationId = `water_${plantId}_${scheduleId}`;
    
    // Cancel existing reminder for this plant/schedule
    await this.cancelWaterReminder(plantId, scheduleId);

    const trigger: Notifications.NotificationTriggerInput = {
      // time interval trigger
      type: 'timeInterval',
      seconds: frequencyDays * 24 * 60 * 60, // Convert days to seconds
      repeats: true,
    } as any;

    const content = {
      title: '🌱 Time to water your plant!',
      body: `${plantName} needs watering. Check your care schedule for details.`,
      data: {
        type: 'water_reminder',
        plantId,
        plantName,
        scheduleId,
      },
    };

    await Notifications.scheduleNotificationAsync({ content, trigger } as any);
    console.log(`Scheduled water reminder for ${plantName} every ${frequencyDays} days`);
    
    return notificationId;
  }

  async cancelWaterReminder(plantId: string, scheduleId: string): Promise<void> {
    const notificationId = `water_${plantId}_${scheduleId}`;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled water reminder for plant ${plantId}, schedule ${scheduleId}`);
  }

  async scheduleHealthInsight(
    plantId: string,
    plantName: string,
    scheduledDate: Date
  ): Promise<string> {
    const notificationId = `health_${plantId}_${Date.now()}`;
    
    const trigger: Notifications.NotificationTriggerInput = {
      type: 'date',
      date: scheduledDate,
    } as any;

    const content = {
      title: '📊 Health insights ready!',
      body: `Your weekly health summary for ${plantName} is available.`,
      data: {
        type: 'health_insight',
        plantId,
        plantName,
      },
    };

    await Notifications.scheduleNotificationAsync({ content, trigger } as any);
    console.log(`Scheduled health insight for ${plantName} on ${scheduledDate.toISOString()}`);
    
    return notificationId;
  }

  async scheduleWeeklyHealthDigest(scheduledDate: Date): Promise<string> {
    const notificationId = `health_digest_${Date.now()}`;
    
    const trigger: Notifications.NotificationTriggerInput = {
      type: 'date',
      date: scheduledDate,
    } as any;

    const content = {
      title: '📈 Weekly plant health digest',
      body: 'Your weekly plant health summary is ready. Check out the latest insights!',
      data: {
        type: 'health_insight',
      },
    };

    await Notifications.scheduleNotificationAsync({ content, trigger } as any);
    console.log(`Scheduled weekly health digest for ${scheduledDate.toISOString()}`);
    
    return notificationId;
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all scheduled notifications');
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from MyPlantScan',
        data: { type: 'general' },
      },
      trigger: { type: 'timeInterval', seconds: 2 } as any,
    } as any);
  }

  // Utility method to check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Method to request permissions (useful for settings screen)
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export utility functions for easy use
export const initializeNotifications = () => notificationService.initialize();
export const getPushToken = () => notificationService.getPushToken();
export const scheduleWaterReminder = (
  plantId: string,
  plantName: string,
  scheduleId: string,
  frequencyDays: number,
  startDate?: Date
) => notificationService.scheduleWaterReminder(plantId, plantName, scheduleId, frequencyDays, startDate);
export const cancelWaterReminder = (plantId: string, scheduleId: string) => 
  notificationService.cancelWaterReminder(plantId, scheduleId);
export const scheduleHealthInsight = (plantId: string, plantName: string, scheduledDate: Date) =>
  notificationService.scheduleHealthInsight(plantId, plantName, scheduledDate);
export const scheduleWeeklyHealthDigest = (scheduledDate: Date) =>
  notificationService.scheduleWeeklyHealthDigest(scheduledDate);
export const cancelAllNotifications = () => notificationService.cancelAllNotifications();
export const areNotificationsEnabled = () => notificationService.areNotificationsEnabled();
export const requestPermissions = () => notificationService.requestPermissions();

