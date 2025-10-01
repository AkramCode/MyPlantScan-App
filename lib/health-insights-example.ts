// Example usage of health insights notifications
// This file demonstrates how to schedule health insights notifications
// in your plant care features

import { useNotifications } from '@/hooks/use-notifications';

export const useHealthInsights = () => {
  const { scheduleHealthInsight, scheduleWeeklyHealthDigest } = useNotifications();

  // Schedule a health insight for a specific plant
  const schedulePlantHealthInsight = async (
    plantId: string,
    plantName: string,
    daysFromNow: number = 7
  ) => {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
    
    return await scheduleHealthInsight(plantId, plantName, scheduledDate);
  };

  // Schedule weekly health digest (every Sunday at 9 AM)
  const scheduleWeeklyDigest = async () => {
    const now = new Date();
    const nextSunday = new Date(now);
    
    // Find next Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7;
    nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    nextSunday.setHours(9, 0, 0, 0); // 9 AM
    
    return await scheduleWeeklyHealthDigest(nextSunday);
  };

  // Example: Schedule health insights after plant identification
  const schedulePostIdentificationInsights = async (plantId: string, plantName: string) => {
    // Schedule insights for 3 days, 1 week, and 2 weeks
    const insights = [
      { days: 3, message: 'Initial health assessment' },
      { days: 7, message: 'Weekly health check' },
      { days: 14, message: 'Bi-weekly health review' },
    ];

    const scheduledInsights = [];
    
    for (const insight of insights) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + insight.days);
      
      const notificationId = await scheduleHealthInsight(plantId, plantName, scheduledDate);
      if (notificationId) {
        scheduledInsights.push({ ...insight, notificationId });
      }
    }
    
    return scheduledInsights;
  };

  return {
    schedulePlantHealthInsight,
    scheduleWeeklyDigest,
    schedulePostIdentificationInsights,
  };
};

// Example usage in a component:
/*
import { useHealthInsights } from '@/lib/health-insights';

export default function PlantIdentificationScreen() {
  const { schedulePostIdentificationInsights } = useHealthInsights();
  
  const handlePlantIdentified = async (plantId: string, plantName: string) => {
    // After successful plant identification
    await schedulePostIdentificationInsights(plantId, plantName);
    
    // Show success message
    Alert.alert(
      'Plant Identified!',
      `We've identified your ${plantName}. Health insights will be scheduled for the next few weeks.`,
      [{ text: 'OK' }]
    );
  };
  
  // ... rest of component
}
*/

