import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  Mail,
  MoonStar,
  RefreshCcw,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/providers/auth-provider';
import { clearOnboardingFlag } from '@/lib/onboarding-storage';
import { MeasurementUnit, ThemePreference, useSettings } from '@/providers/settings-provider';

const measurementLabels: Record<MeasurementUnit, string> = {
  metric: 'Metric (Celsius, ml)',
  imperial: 'Imperial (Fahrenheit, oz)',
};

const themeLabels: Record<ThemePreference, string> = {
  system: 'Match system',
  light: 'Light',
  dark: 'Dark',
};

const privacyPolicyUrl = 'https://myplantscan.com/privacy';
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
  const { user, profile, signOut } = useAuth();
  const { settings, updateSettings, resetSettings, isLoading, isSaving } = useSettings();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

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

  const accountTitle = useMemo(
    () => (user ? profile?.full_name || 'MyPlantScan gardener' : 'Guest mode'),
    [profile?.full_name, user]
  );

  const accountSubtitle = useMemo(
    () =>
      user
        ? user.email || 'Synced securely with MyPlantScan Cloud.'
        : 'Sign in to sync your garden across devices.',
    [user]
  );
  const toggleMeasurementUnit = useCallback(() => {
    updateSettings({
      measurementUnit: settings.measurementUnit === 'metric' ? 'imperial' : 'metric',
    });
  }, [settings.measurementUnit, updateSettings]);

  const cycleThemePreference = useCallback(() => {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const currentIndex = order.indexOf(settings.themePreference);
    const next = order[(currentIndex + 1) % order.length];
    updateSettings({ themePreference: next });
  }, [settings.themePreference, updateSettings]);

  const handleResetPreferences = useCallback(() => {
    Alert.alert(
      'Reset preferences',
      'This will restore notification, appearance, and privacy settings to their defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetSettings();
          },
        },
      ]
    );
  }, [resetSettings]);

  const resetOnboarding = useCallback(async () => {
    try {
      await clearOnboardingFlag();
      Alert.alert(
        'Onboarding reset',
        'The welcome tour will appear the next time you open MyPlantScan.'
      );
    } catch (error) {
      console.error('settings: reset onboarding error', error);
      Alert.alert('Reset failed', 'Please try again later.');
    }
  }, []);

  const handleResetOnboarding = useCallback(() => {
    Alert.alert(
      'Show onboarding again',
      'We will reset your onboarding progress so you can view the tour on the next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => { void resetOnboarding(); } },
      ]
    );
  }, [resetOnboarding]);

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

  const openExternal = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unable to open link', 'Please visit ' + url + ' in your browser.');
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error('settings: open link error', error);
      Alert.alert('Unable to open link', 'Please try again later.');
    }
  }, []);

  const handleSignIn = useCallback(() => {
    router.push('/auth');
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out of MyPlantScan on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('settings: sign out error', error);
              Alert.alert('Sign out failed', 'Please try again.');
            }
          },
        },
      ]
    );
  }, [signOut]);

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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <SettingRow
                icon={<ShieldCheck size={20} color={Colors.primary} />}
                title={accountTitle}
                subtitle={accountSubtitle}
                disabled
                isLast={!user}
              />
              {user ? (
                <SettingRow
                  icon={<LogOut size={20} color={Colors.error} />}
                  title='Sign out'
                  subtitle='Remove account data from this device.'
                  onPress={handleSignOut}
                  isLast
                />
              ) : (
                <SettingRow
                  icon={<LogIn size={20} color={Colors.primary} />}
                  title='Sign in or create account'
                  subtitle='Back up your garden and health history.'
                  onPress={handleSignIn}
                  isLast
                />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <SettingRow
                icon={<Bell size={20} color={Colors.primary} />}
                title='Push notifications'
                subtitle='Get alerts when identifications or health reports are ready.'
                trailing={
                  <Switch
                    value={settings.pushNotifications}
                    onValueChange={value => updateSettings({ pushNotifications: value })}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray300}
                    style={styles.switch}
                  />
                }
                onPress={() => updateSettings({ pushNotifications: !settings.pushNotifications })}
              />
              <SettingRow
                icon={<CalendarDays size={20} color={Colors.primary} />}
                title='Watering reminders'
                subtitle='Plan gentle nudges based on your plant care schedule.'
                trailing={
                  <Switch
                    value={settings.wateringReminders}
                    onValueChange={value => updateSettings({ wateringReminders: value })}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray300}
                    style={styles.switch}
                  />
                }
                onPress={() => updateSettings({ wateringReminders: !settings.wateringReminders })}
              />
              <SettingRow
                icon={<Activity size={20} color={Colors.primary} />}
                title='Health insights digest'
                subtitle='Receive weekly summaries about plant health trends.'
                trailing={
                  <Switch
                    value={settings.healthInsights}
                    onValueChange={value => updateSettings({ healthInsights: value })}
                    trackColor={{ false: Colors.gray300, true: Colors.primary }}
                    thumbColor={Colors.white}
                    ios_backgroundColor={Colors.gray300}
                    style={styles.switch}
                  />
                }
                onPress={() => updateSettings({ healthInsights: !settings.healthInsights })}
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
            <Text style={styles.sectionTitle}>Data & security</Text>
            <View style={styles.card}>
              <SettingRow
                icon={<RefreshCcw size={20} color={Colors.primary} />}
                title='Reset onboarding tour'
                subtitle='Show the welcome experience on the next launch.'
                onPress={handleResetOnboarding}
              />
              <SettingRow
                icon={<SlidersHorizontal size={20} color={Colors.primary} />}
                title='Restore default preferences'
                subtitle='Reset notifications, theme, and privacy settings.'
                onPress={handleResetPreferences}
                isLast
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.card}>
              <SettingRow
                icon={<HelpCircle size={20} color={Colors.primary} />}
                title='Help centre'
                subtitle='Guides, FAQs, and troubleshooting tips.'
                onPress={() => router.push('/help')}
              />
              <SettingRow
                icon={<Mail size={20} color={Colors.primary} />}
                title='Contact support'
                subtitle='Email our plant experts for assistance.'
                onPress={handleSupportEmail}
              />
              <SettingRow
                icon={<Info size={20} color={Colors.primary} />}
                title='About MyPlantScan'
                subtitle='Our mission and technology.'
                onPress={() => router.push('/about')}
              />
              <SettingRow
                icon={<ShieldCheck size={20} color={Colors.primary} />}
                title='Privacy policy'
                subtitle='Understand how we protect your data.'
                onPress={() => openExternal(privacyPolicyUrl)}
                isLast
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>MyPlantScan v{appVersion}</Text>
            <Text style={styles.footerSubtext}>Grow smarter every day.</Text>
          </View>
        </ScrollView>
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

