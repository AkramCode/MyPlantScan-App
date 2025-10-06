import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Linking, Share, Modal } from 'react-native';
import { Info, Star, Share2, HelpCircle, Trash2, ChevronRight, Settings, Shield, FileText, Droplets, Sun, User, LogIn, LogOut } from 'lucide-react-native';
import { usePlantStore } from '@/hooks/plant-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';
import AuthScreen from '@/components/AuthScreen';
import ProfileModal from '@/components/ProfileModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MoreScreen() {
  const { identifications, userPlants, healthRecords, clearAllRemoteData } = usePlantStore();
  const { user, profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const performClearData = async () => {
    try {
        const BASE_KEYS = ['plant_identifications', 'plant_health_records', 'user_plants'];

        let remoteSummary: Awaited<ReturnType<typeof clearAllRemoteData>> | null = null;
        let remoteErrorMessage: string | null = null;

        try {
          remoteSummary = await clearAllRemoteData();
        } catch (remoteError) {
          remoteErrorMessage =
            remoteError instanceof Error ? remoteError.message : 'Unknown cloud error';
          console.warn('MoreScreen: clearAllRemoteData failed', remoteError);
        }

        if (Platform.OS === 'web') {
          // Remove any key that starts with our base keys (namespaced keys look like base:user:xyz)
          const toRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (BASE_KEYS.some(prefix => key.startsWith(prefix))) {
              toRemove.push(key);
            }
          }
          toRemove.forEach(k => localStorage.removeItem(k));
        } else {
          const allKeys = await AsyncStorage.getAllKeys();
          const filtered = allKeys.filter(k => BASE_KEYS.some(prefix => k.startsWith(prefix)));
          if (filtered.length) {
            await AsyncStorage.multiRemove(filtered);
          }
        }

        // Reset react-query caches to empty arrays so UI updates immediately
        queryClient.setQueriesData({ queryKey: ['plant_identifications'] }, () => []);
        queryClient.setQueriesData({ queryKey: ['plant_health_records'] }, () => []);
        queryClient.setQueriesData({ queryKey: ['user_plants'] }, () => []);

        // Invalidate to ensure any subsequent refetch respects cleared state
        queryClient.invalidateQueries({ queryKey: ['plant_identifications'] });
        queryClient.invalidateQueries({ queryKey: ['plant_health_records'] });
        queryClient.invalidateQueries({ queryKey: ['user_plants'] });

        const formatCount = (count: number, singular: string, plural: string) =>
          `${count} ${count === 1 ? singular : plural}`;

        const title = remoteErrorMessage ? 'Partial Success' : 'Success';
        let message = 'All local plant data has been cleared.';

        if (remoteSummary) {
          const { identifications: identCount, healthRecords: healthCount, gardenPlants: gardenCount } = remoteSummary;
          const totalRemote = identCount + healthCount + gardenCount;

          if (totalRemote > 0) {
            const remoteParts: string[] = [];
            if (identCount) {
              remoteParts.push(formatCount(identCount, 'identification', 'identifications'));
            }
            if (gardenCount) {
              remoteParts.push(formatCount(gardenCount, 'garden plant', 'garden plants'));
            }
            if (healthCount) {
              remoteParts.push(formatCount(healthCount, 'health record', 'health records'));
            }
            message += ` Removed ${remoteParts.join(', ')} from cloud storage.`;
          } else {
            message += ' No cloud data was stored for this account.';
          }
        } else if (remoteErrorMessage) {
          message += ` Cloud data could not be cleared (${remoteErrorMessage}).`;
        }

        Alert.alert(title, message.trim());
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data. Please try again.');
    }
  };

  const handleClearData = () => {
    setShowClearModal(true);
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        message: 'Check out MyPlantScan! AI-powered plant identification and health analysis app. Discover and care for plants like never before!',
        title: 'MyPlantScan - AI Plant Identification',
        url: Platform.OS === 'web' ? window.location.href : undefined,
      };

      if (Platform.OS !== 'web') {
        await Share.share(shareContent);
      } else {
        if (navigator.share) {
          await navigator.share(shareContent);
        } else {
          // Fallback for web browsers without native sharing
          const text = `${shareContent.message} ${shareContent.url || ''}`;
          await navigator.clipboard.writeText(text);
          Alert.alert('Copied!', 'Share message copied to clipboard.');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Unable to share at this time.');
      }
    }
  };

  const handleRate = async () => {
    try {
      const appStoreUrl = Platform.select({
        ios: 'https://apps.apple.com/app/myplantscan',
        android: 'https://play.google.com/store/apps/details?id=com.myplantscan',
        default: 'https://myplantscan.com/feedback'
      });

      const canOpen = await Linking.canOpenURL(appStoreUrl);
      if (canOpen) {
        await Linking.openURL(appStoreUrl);
      } else {
        Alert.alert(
          'Rate MyPlantScan',
          'Thank you for using MyPlantScan! Your feedback helps us improve. Please visit your app store to leave a review.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening rating:', error);
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Rate MyPlantScan',
          'Thank you for using MyPlantScan! Your feedback helps us improve.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleHelp = () => {
    router.push('/help');
  };



  const handleAbout = () => {
    router.push('/about');
  };

  const handlePrivacyPolicy = async () => {
    try {
      const privacyUrl = 'https://www.myplantscan.com/privacy';
      const canOpen = await Linking.canOpenURL(privacyUrl);
      if (canOpen) {
        await Linking.openURL(privacyUrl);
      } else {
        Alert.alert(
          'Privacy Policy',
          'We respect your privacy. Your plant photos are processed securely and not stored on our servers. All data is kept locally on your device unless you choose to share it.\n\nFor our complete privacy policy, visit: www.myplantscan.com/privacy'
        );
      }
    } catch (error) {
      console.error('Error opening privacy policy:', error);
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Privacy Policy',
          'We respect your privacy. Your plant photos are processed securely and not stored on our servers. All data is kept locally on your device unless you choose to share it.'
        );
      }
    }
  };

  const handleTermsOfService = async () => {
    try {
      const termsUrl = 'https://www.myplantscan.com/terms';
      const canOpen = await Linking.canOpenURL(termsUrl);
      if (canOpen) {
        await Linking.openURL(termsUrl);
      } else {
        Alert.alert(
          'Terms of Service',
          'By using MyPlantScan, you agree to our terms of service. The app is provided for educational and informational purposes. Always consult with professionals for plant care and safety advice.\n\nFor complete terms, visit: www.myplantscan.com/terms'
        );
      }
    } catch (error) {
      console.error('Error opening terms of service:', error);
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Terms of Service',
          'By using MyPlantScan, you agree to our terms of service. The app is provided for educational and informational purposes.'
        );
      }
    }
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('Signed Out', 'You have been successfully signed out.');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const allData = {
        identifications,
        userPlants,
        healthRecords,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const dataString = JSON.stringify(allData, null, 2);
      
      if (Platform.OS === 'web') {
        // Web: Download as file
        const blob = new Blob([dataString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `myplantscan-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Your data has been downloaded as a JSON file.');
      } else {
        // Mobile: Share the data
        await Share.share({
          message: dataString,
          title: 'MyPlantScan Data Export'
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to export data. Please try again.');
      }
    }
  };

  const toolItems = [
    {
      icon: Droplets,
      title: 'Water Calculator',
      subtitle: 'Get personalized watering schedules',
      onPress: () => router.push('/water-calculator'),
    },
    {
      icon: Sun,
      title: 'Light Meter',
      subtitle: 'Measure light levels for your plants',
      onPress: () => router.push('/light-meter'),
    },
  ];

  const menuItems = [
    {
      icon: Star,
      title: 'Rate MyPlantScan',
      subtitle: 'Help us improve with your feedback',
      onPress: handleRate,
    },
    {
      icon: Share2,
      title: 'Share with Friends',
      subtitle: 'Spread the love for plants',
      onPress: handleShare,
    },
    {
      icon: HelpCircle,
      title: 'Help & Tips',
      subtitle: 'Get better identification results',
      onPress: handleHelp,
    },
    {
      icon: Settings,
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      onPress: handleSettings,
    },
  ];

  const infoItems = [
    {
      icon: Info,
      title: 'About MyPlantScan',
      subtitle: 'Learn more about the app',
      onPress: handleAbout,
    },
    {
      icon: Shield,
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      onPress: handlePrivacyPolicy,
    },
    {
      icon: FileText,
      title: 'Terms of Service',
      subtitle: 'Usage terms and conditions',
      onPress: handleTermsOfService,
    },
  ];

  const dataItems = [
    {
      icon: Share2,
      title: 'Export Data',
      subtitle: 'Download your plant data',
      onPress: handleExportData,
      isDangerous: false,
    },
    {
      icon: Trash2,
      title: 'Clear All Data',
      subtitle: 'Delete all identifications and records',
      onPress: handleClearData,
      isDangerous: true,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>Settings and information</Text>
        </View>

        {/* Authentication Section */}
        <View style={styles.authSection}>
          {user ? (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() => setShowProfileModal(true)}
              testID="user-profile-card"
            >
              <View style={styles.userCardLeft}>
                <View style={styles.userAvatar}>
                  <User size={24} color="#22C55E" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {profile?.full_name || 'User'}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInCard}
              onPress={() => setShowAuthScreen(true)}
              testID="signin-card"
            >
              <View style={styles.signInCardLeft}>
                <View style={styles.signInIcon}>
                  <LogIn size={24} color="#22C55E" />
                </View>
                <View style={styles.signInInfo}>
                  <Text style={styles.signInTitle}>Sign In</Text>
                  <Text style={styles.signInSubtitle}>Sync your data across devices</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Plant Journey</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{identifications.length}</Text>
              <Text style={styles.statLabel}>Plants Identified</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userPlants.length}</Text>
              <Text style={styles.statLabel}>In Garden</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{healthRecords.length}</Text>
              <Text style={styles.statLabel}>Health Checks</Text>
            </View>
          </View>
        </View>

        {/* Plant Care Tools */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Plant Care Tools</Text>
          {toolItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <IconComponent size={20} color="#22C55E" />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>App Features</Text>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <IconComponent size={20} color="#22C55E" />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Information Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Information</Text>
          {infoItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.iconContainer}>
                    <IconComponent size={20} color="#6B7280" />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Data Management */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          {dataItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={[styles.menuItem, item.isDangerous && styles.dangerousMenuItem]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.iconContainer, item.isDangerous && styles.dangerousIconContainer]}>
                    <IconComponent size={20} color={item.isDangerous ? "#EF4444" : "#22C55E"} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemTitle, item.isDangerous && styles.dangerousText]}>
                      {item.title}
                    </Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Account Management - Only show for authenticated users */}
        {user && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity
              style={[styles.menuItem, styles.dangerousMenuItem]}
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, styles.dangerousIconContainer]}>
                  <LogOut size={20} color="#EF4444" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, styles.dangerousText]}>
                    Sign Out
                  </Text>
                  <Text style={styles.menuItemSubtitle}>
                    Sign out of your account
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>MyPlantScan</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            AI-powered plant identification and health analysis
          </Text>
          <Text style={styles.poweredBy}>
            Powered by Google Gemini AI
          </Text>
        </View>
      </ScrollView>
      
      {/* Auth Screen Modal */}
      {showAuthScreen && (
          <View style={styles.authModal}>
            <AuthScreen onAuthSuccess={() => setShowAuthScreen(false)} onClose={() => setShowAuthScreen(false)} />
          </View>
        )}
      
      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Clear Data Modal */}
      <Modal visible={showClearModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear All Data</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete all your plant identifications, garden plants, and health records. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={async () => {
                  setShowClearModal(false);
                  await performClearData();
                }}
              >
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dangerousMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerousIconContainer: {
    backgroundColor: '#FEF2F2',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  dangerousText: {
    color: '#EF4444',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  poweredBy: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  authSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signInCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  signInIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  signInInfo: {
    flex: 1,
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  signInSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  authModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 10,
    alignItems: 'center',
  },
  clearText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
