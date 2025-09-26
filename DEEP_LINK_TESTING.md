# Deep Link Testing Guide for MyPlantScan

This guide provides comprehensive instructions for testing deep links in the MyPlantScan React Native Expo app.

## Deep Link Configuration Summary

- **Scheme**: `myplantscan://`
- **iOS Bundle ID**: `com.myplantscan.www`
- **Android Package**: `com.myplantscan.www`
- **Web Domains**: `myplantscan.com`, `www.myplantscan.com`

## Supported Deep Link URLs

### Authentication Links
- `myplantscan://auth/confirm?token=<confirmation_token>`
- `myplantscan://reset-password?token=<reset_token>`

### App Navigation Links
- `myplantscan://` (Home)
- `myplantscan://health` (Health tab)
- `myplantscan://camera` (Camera tab)
- `myplantscan://garden` (Garden tab)
- `myplantscan://plant-details/<id>` (Plant details)
- `myplantscan://health-report/<id>` (Health report)
- `myplantscan://water-calculator` (Water calculator)
- `myplantscan://light-meter` (Light meter)

### Universal Links (Web Fallback)
- `https://myplantscan.com/auth/confirm?token=<token>`
- `https://www.myplantscan.com/auth/confirm?token=<token>`
- `https://www.myplantscan.com/reset-password?token=<token>`

## Fallback Behavior

If a device does not have the native app installed, universal links fall back to https://www.myplantscan.com where the marketing confirmation pages automatically attempt to reopen the app via the custom scheme. Users still see clear success messaging and can tap an explicit "Open MyPlantScan App" button if the OS blocks the deep link.
## Local Testing Methods

### 1. iOS Simulator Testing

#### Using Safari (iOS Simulator)
1. Open Safari in iOS Simulator
2. Type the deep link URL in the address bar:
   ```
   myplantscan://auth/confirm?token=test123
   ```
3. Press Enter - iOS will prompt to open the app

#### Using Terminal (macOS)
```bash
xcrun simctl openurl booted "myplantscan://auth/confirm?token=test123"
```

#### Using Xcode
1. Open your project in Xcode
2. Go to Product â†’ Scheme â†’ Edit Scheme
3. Select "Run" â†’ "Arguments" â†’ "Arguments Passed On Launch"
4. Add: `-FIRDebugEnabled`
5. In "Environment Variables" add:
   - Name: `URL_SCHEME_TEST`
   - Value: `myplantscan://auth/confirm?token=test123`

### 2. Android Testing

#### Using ADB (Android Debug Bridge)
```bash
# Test auth confirmation
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "myplantscan://auth/confirm?token=test123" \
  com.myplantscan.www

# Test password reset
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "myplantscan://reset-password?token=reset456" \
  com.myplantscan.www

# Test navigation
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "myplantscan://health" \
  com.myplantscan.www
```

#### Using Android Studio
1. Open Android Studio
2. Go to Run â†’ Edit Configurations
3. In "Launch Options", select "URL"
4. Enter the deep link URL: `myplantscan://auth/confirm?token=test123`

### 3. Physical Device Testing

#### iOS (Physical Device)
1. Send the deep link via Messages, Mail, or Notes
2. Tap the link to test
3. Or use Safari and type the URL directly

#### Android (Physical Device)
1. Send via SMS, email, or messaging app
2. Use Chrome browser to type the URL
3. Or use a QR code generator with the deep link

### 4. Development Server Testing

#### Using Expo CLI
```bash
# Start the development server
npx expo start

# In another terminal, test deep links
npx uri-scheme open myplantscan://auth/confirm?token=test123 --ios
npx uri-scheme open myplantscan://auth/confirm?token=test123 --android
```

## Testing Scenarios

### 1. Email Confirmation Flow
```bash
# Test successful confirmation
myplantscan://auth/confirm?token=valid_token_123

# Test invalid token
myplantscan://auth/confirm?token=invalid_token

# Test missing token
myplantscan://auth/confirm
```

### 2. Password Reset Flow
```bash
# Test password reset
myplantscan://reset-password?token=reset_token_456

# Test invalid reset token
myplantscan://reset-password?token=invalid_reset

# Test missing token
myplantscan://reset-password
```

### 3. Navigation Testing
```bash
# Test tab navigation
myplantscan://health
myplantscan://camera
myplantscan://garden

# Test screen navigation with parameters
myplantscan://plant-details/123
myplantscan://health-report/456
```

## Production Testing

### 1. TestFlight (iOS)
1. Upload build to TestFlight
2. Install on test devices
3. Test deep links via email, SMS, or web

### 2. Google Play Internal Testing (Android)
1. Upload to Google Play Console
2. Create internal testing track
3. Install on test devices
4. Test deep links

### 3. Universal Links Testing
1. Set up web server with proper domain verification
2. Add `.well-known/apple-app-site-association` (iOS)
3. Add `.well-known/assetlinks.json` (Android)
4. Test web fallback behavior

## Debugging Deep Links

### 1. Enable Debug Logging
Add to your app's main component:
```javascript
import * as Linking from 'expo-linking';

// Log initial URL
Linking.getInitialURL().then(url => {
  console.log('Initial URL:', url);
});

// Log incoming URLs
Linking.addEventListener('url', (event) => {
  console.log('Incoming URL:', event.url);
});
```

### 2. Check URL Parsing
```javascript
import { useLocalSearchParams } from 'expo-router';

// In your screen component
const params = useLocalSearchParams();
console.log('URL Parameters:', params);
```

### 3. Verify App State
```javascript
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  console.log('App State:', nextAppState);
});
```

## Common Issues and Solutions

### 1. App Not Opening
- Verify the URL scheme is correctly configured in `app.json`
- Check that the app is installed on the device
- Ensure the bundle ID/package name matches

### 2. Parameters Not Received
- Check URL encoding of parameters
- Verify the linking configuration in `_layout.tsx`
- Ensure screen names match the routing configuration

### 3. iOS Universal Links Not Working
- Verify domain ownership
- Check `.well-known/apple-app-site-association` file
- Ensure HTTPS is properly configured

### 4. Android Intent Filters Not Working
- Verify `intentFilters` in `app.json`
- Check that `autoVerify` is enabled
- Ensure the package name is correct

## EAS Build Configuration

### 1. Build Profiles (`eas.json`)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### 2. Build Commands
```bash
# Development build
eas build --profile development --platform all

# Preview build for testing
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all
```

## App Store Submission Checklist

### iOS App Store
- [ ] Bundle identifier matches: `com.myplantscan.www`
- [ ] URL schemes configured in Info.plist
- [ ] Associated domains configured
- [ ] Universal links tested
- [ ] Deep link handling tested in production build

### Google Play Store
- [ ] Package name matches: `com.myplantscan.www`
- [ ] Intent filters configured
- [ ] App links verification enabled
- [ ] Deep link handling tested in production build

## Security Considerations

1. **Token Validation**: Always validate tokens on the server side
2. **Parameter Sanitization**: Sanitize all URL parameters
3. **Authentication State**: Check user authentication before processing sensitive deep links
4. **Rate Limiting**: Implement rate limiting for authentication endpoints
5. **Expiration**: Ensure tokens have appropriate expiration times

## Monitoring and Analytics

Consider implementing analytics to track:
- Deep link usage patterns
- Successful vs failed deep link attempts
- User journey from deep links
- Conversion rates from email/SMS campaigns

This comprehensive testing approach ensures your deep links work reliably across all platforms and scenarios.

