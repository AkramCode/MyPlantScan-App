import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ResponsiveScrollView from '@/components/layout/ResponsiveScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Mail,
  MoonStar,
  Ruler,
  
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
// onboarding test controls removed for production
import { MeasurementUnit, ThemePreference, useSettings } from '@/providers/settings-provider';
import { useSimpleNotifications } from '@/hooks/use-simple-notifications';

const measurementLabels: Record<MeasurementUnit, string> = {
  metric: 'Metric (Celsius, ml)',
  imperial: 'Imperial (Fahrenheit, oz)',
};

const themeLabels: Record<ThemePreference, string> = {
  system: 'Match system',
  light: 'Light',
  dark: 'Dark',
};

const supportEmail = 'support@myplantscan.com';


interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  isLast,
  disabled,
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.7 : 1}
    onPress={onPress}
    disabled={!onPress || disabled}
    style={[
      styles.row,
      isLast ? styles.rowLast : null,
      disabled ? styles.rowDisabled : null,
    ]}
  >
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    <View style={styles.rowRight}>
      {trailing ?? (onPress ? <ChevronRight size={20} color={Colors.gray400} /> : null)}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  // user/profile/signOut and resetSettings intentionally omitted when unused
  const { settings, updateSettings, isLoading, isSaving } = useSettings();
  const { 
    hasPermission, 
    togglePushNotifications, 
    toggleWateringReminders, 
    toggleHealthInsights,
    requestPermissions,
    sendTestNotification 
  } = useSimpleNotifications();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  // test toggles removed for production

  const measurementLabel = useMemo(
    () => measurementLabels[settings.measurementUnit],
    [settings.measurementUnit]
  );

  const themeLabel = useMemo(
    () => themeLabels[settings.themePreference],
    [settings.themePreference]
  );

  const analyticsSubtitle = useMemo(
    () =>
      settings.analyticsOptIn
        ? 'Allow anonymous usage analytics to improve recommendations.'
        : 'Analytics are disabled. You can re-enable them at any time.',
    [settings.analyticsOptIn]
  );

  const toggleMeasurementUnit = useCallback(() => {
    updateSettings({
      measurementUnit: settings.measurementUnit === 'metric' ? 'imperial' : 'metric',
    });
  }, [settings.measurementUnit, updateSettings]);

  const handlePushNotificationsToggle = useCallback(async (value: boolean) => {
    const success = await togglePushNotifications(value);
    if (success) {
      updateSettings({ pushNotifications: value });
    }
  }, [togglePushNotifications, updateSettings]);

  const handleWateringRemindersToggle = useCallback(async (value: boolean) => {
    const success = await toggleWateringReminders(value);
    if (success) {
      updateSettings({ wateringReminders: value });
    }
  }, [toggleWateringReminders, updateSettings]);

  const handleHealthInsightsToggle = useCallback(async (value: boolean) => {
    const success = await toggleHealthInsights(value);
    if (success) {
      updateSettings({ healthInsights: value });
    }
  }, [toggleHealthInsights, updateSettings]);

  const handleRequestPermissions = useCallback(async () => {
    await requestPermissions();
  }, [requestPermissions]);

  const cycleThemePreference = useCallback(() => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const currentIndex = order.indexOf(settings.themePreference);
    const next = order[(currentIndex + 1) % order.length];
    updateSettings({ themePreference: next });
  }, [settings.themePreference, updateSettings]);


  // restart onboarding removed

  // force onboarding toggle removed for production

  // restart onboarding action removed for production

  const handleSupportEmail = useCallback(async () => {
    const subject = encodeURIComponent('MyPlantScan support request');
    const bodyLines = [
      'Hi MyPlantScan team,',
      '',
      'I need help with:',
      '',
      '[Describe your issue]',
      '',
      'App version: ' + appVersion,
      'Platform: ' + Platform.OS,
      '',
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    const mailto = 'mailto:' + supportEmail + '?subject=' + subject + '&body=' + body;

    try {
      const canOpen = await Linking.canOpenURL(mailto);
      if (!canOpen) {
        Alert.alert(
          'Email unavailable',
          'Please email support@myplantscan.com from your mail app.'
        );
        return;
      }
      await Linking.openURL(mailto);
    } catch (error) {
      console.error('settings: support email error', error);
      Alert.alert(
        'Email unavailable',
        'Please email support@myplantscan.com from your mail app.'
      );
    }
  }, [appVersion]);



  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.push('/(tabs)');
  }, []);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole='button'
          accessibilityLabel='Go back'
        >
          <ArrowLeft size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight}>
          {isSaving ? <ActivityIndicator size='small' color={Colors.primary} /> : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={Colors.primary} />
        </View>
      ) : (
        <ResponsiveScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <SettingRow
                icon={<Bell size={20} color={Colors.primary} />}
                title='Push notifications'
                subtitle='Get alerts when identifications or health reports are ready.'
                trailing={
                  <Switch
                    value={settings.pushNotifications && hasPermission}
                    onValueChange={handlePushNotificationsToggle}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray300}
                    style={styles.switch}
                  />
                }
                onPress={() => {
                  if (!hasPermission) {
                    handleRequestPermissions();
                  } else {
                    handlePushNotificationsToggle(!settings.pushNotifications);
                  }
                }}
              />
              <SettingRow
                icon={<CalendarDays size={20} color={Colors.primary} />}
                title='Watering reminders'
                subtitle='Plan gentle nudges based on your plant care schedule.'
                trailing={
                  <Switch
                    value={settings.wateringReminders && hasPermission}
                    onValueChange={handleWateringRemindersToggle}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray300}
                    style={styles.switch}
                  />
                }
                onPress={() => {
                  if (!hasPermission) {
                    handleRequestPermissions();
                  } else {
                    handleWateringRemindersToggle(!settings.wateringReminders);
                  }
                }}
              />
              <SettingRow
                icon={<Activity size={20} color={Colors.primary} />}
                title='Health insights digest'
                subtitle='Receive weekly summaries about plant health trends.'
                trailing={
                  <Switch
                    value={settings.healthInsights && hasPermission}
                    onValueChange={handleHealthInsightsToggle}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray300}
                    style={styles.switch}
                  />
                }
                onPress={() => {
                  if (!hasPermission) {
                    handleRequestPermissions();
                  } else {
                    handleHealthInsightsToggle(!settings.healthInsights);
                  }
                }}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <SettingRow
                icon={<Ruler size={20} color={Colors.primary} />}
                title='Measurement units'
                subtitle={measurementLabel}
                onPress={toggleMeasurementUnit}
              />
              <SettingRow
                icon={<MoonStar size={20} color={Colors.primary} />}
                title='Theme'
                subtitle={themeLabel}
                onPress={cycleThemePreference}
              />
              <SettingRow
                icon={<BarChart3 size={20} color={Colors.primary} />}
                title='Product analytics'
                subtitle={analyticsSubtitle}
                trailing={
                  <Switch
                    value={settings.analyticsOptIn}
                    onValueChange={value => updateSettings({ analyticsOptIn: value })}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray300}
                    style={styles.switch}
                  />
                }
                onPress={() => updateSettings({ analyticsOptIn: !settings.analyticsOptIn })}
                isLast
              />
            </View>
          </View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.card}>
              <SettingRow
                icon={<Mail size={20} color={Colors.primary} />}
                title='Contact support'
                subtitle='Email our plant experts for assistance.'
                onPress={handleSupportEmail}
              />
              {__DEV__ && (
                <SettingRow
                  icon={<Bell size={20} color={Colors.primary} />}
                  title='Test notification'
                  subtitle='Send a test notification to verify setup.'
                  onPress={sendTestNotification}
                  isLast
                />
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>MyPlantScan v{appVersion}</Text>
            <Text style={styles.footerSubtext}>Grow smarter every day.</Text>
          </View>
        </ResponsiveScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDisabled: {
    opacity: 0.5,
  },
  switch: {
    marginLeft: 12,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});

