# Production-Ready Push Notifications for MyPlantScan

This implementation provides a complete, production-ready push notification system for Expo SDK 54, supporting all three notification types: general push notifications, water reminders, and health insights.

## Features

- ✅ **Production-ready** with proper error handling and permissions management
- ✅ **Three notification types**: General, Water Reminders, Health Insights
- ✅ **Android notification channels** with proper priorities and styling
- ✅ **iOS APNs support** with proper configuration
- ✅ **Permission handling** with user-friendly prompts
- ✅ **Notification scheduling** with repeat functionality
- ✅ **Deep linking** to relevant app sections
- ✅ **Settings integration** with proper toggle states
- ✅ **Test notifications** for development

## Setup Required

### 1. Update app.json (Already Done)
The `app.json` has been updated with:
- Notification permissions (`RECEIVE_BOOT_COMPLETED`, `VIBRATE`)
- Expo notifications plugin configuration
- Android notification channels

### 2. Firebase Setup (Required for Production)
For Android push notifications to work in production:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project

2. **Add Android App**:
   - Package name: `com.myplantscan.www`
   - Download `google-services.json`

3. **Place google-services.json**:
   - Put the file in your project root
   - Update `app.json` to include:
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

### 3. iOS Setup (Required for Production)
For iOS push notifications:

1. **Apple Developer Account**:
   - Ensure you have a paid Apple Developer account

2. **Generate APNs Key**:
   - Go to Apple Developer Portal > Certificates, Identifiers & Profiles > Keys
   - Create new key with "Apple Push Notifications service (APNs)"
   - Download the `.p8` file

3. **Configure with EAS**:
   ```bash
   eas credentials
   ```
   - Upload your APNs key
   - Associate with your app

### 4. Update Project ID
In `lib/notifications.ts`, replace `'your-project-id'` with your actual Expo project ID:
```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-actual-project-id', // Replace this
});
```

## Usage

### Basic Setup
The notification service automatically initializes when the app starts. No additional setup required.

### Settings Integration
The settings screen now properly handles:
- Permission requests
- Toggle states based on actual permissions
- User-friendly error messages

### Water Reminders
```typescript
import { useNotifications } from '@/hooks/use-notifications';

const { scheduleWaterReminder } = useNotifications();

// Schedule a water reminder
await scheduleWaterReminder(
  'plant-123',           // Plant ID
  'My Fiddle Leaf Fig',  // Plant name
  'schedule-456',        // Schedule ID
  7                      // Every 7 days
);
```

### Health Insights
```typescript
import { useNotifications } from '@/hooks/use-notifications';

const { scheduleHealthInsight, scheduleWeeklyHealthDigest } = useNotifications();

// Schedule a health insight
await scheduleHealthInsight(
  'plant-123',           // Plant ID
  'My Fiddle Leaf Fig',  // Plant name
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
);

// Schedule weekly digest
await scheduleWeeklyHealthDigest(
  new Date('2024-01-07T09:00:00') // Next Sunday at 9 AM
);
```

## Testing

### Development Testing
1. **Test Notification Button**: Available in settings (dev mode only)
2. **Physical Device Required**: Push notifications only work on physical devices
3. **Permission Testing**: Toggle notifications in settings to test permission flow

### Production Testing
1. **Build with EAS**:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

2. **Test on Production Builds**: Install the production build and test notifications

## Notification Types

### 1. General Push Notifications
- **Purpose**: App updates, identification results, general alerts
- **Channel**: `default` (Android)
- **Priority**: High
- **Behavior**: One-time notifications

### 2. Water Reminders
- **Purpose**: Plant watering schedule reminders
- **Channel**: `water_reminders` (Android)
- **Priority**: High
- **Behavior**: Repeating notifications based on schedule
- **Deep Link**: Opens plant details or garden screen

### 3. Health Insights
- **Purpose**: Weekly health summaries and insights
- **Channel**: `health_insights` (Android)
- **Priority**: Default
- **Behavior**: Scheduled notifications
- **Deep Link**: Opens health screen

## Error Handling

The system includes comprehensive error handling:
- Permission denied scenarios
- Network failures
- Invalid notification data
- Graceful fallbacks

## Security Considerations

- Push tokens are handled securely
- No sensitive data in notification payloads
- Proper permission validation
- User consent for all notification types

## Troubleshooting

### Notifications Not Working
1. **Check Permissions**: Ensure notifications are enabled in device settings
2. **Physical Device**: Push notifications don't work in simulators
3. **Production Build**: Development builds use Expo's credentials
4. **Firebase Setup**: Ensure `google-services.json` is properly configured

### Android Issues
1. **Notification Channels**: Ensure channels are properly configured
2. **Battery Optimization**: Some devices may disable notifications for battery saving
3. **Do Not Disturb**: Check if Do Not Disturb mode is enabled

### iOS Issues
1. **APNs Certificate**: Ensure APNs key is properly configured
2. **Provisioning Profile**: Ensure push notifications capability is enabled
3. **App Store**: Test notifications work in TestFlight builds

## Future Enhancements

- [ ] Rich notifications with images
- [ ] Action buttons on notifications
- [ ] Notification history
- [ ] Custom notification sounds
- [ ] Notification analytics
- [ ] A/B testing for notification content

## Support

For issues with the notification system:
1. Check the console logs for error messages
2. Verify all setup steps are completed
3. Test on physical devices
4. Contact support with specific error messages

