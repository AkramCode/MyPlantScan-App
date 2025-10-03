import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, Platform, ActivityIndicator } from 'react-native';
import ResponsiveScrollView from '@/components/layout/ResponsiveScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Users, 
  Shield, 
  FileText, 
  ExternalLink, 
  Heart, 
  Globe,
  Mail
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const handleLinkPress = async (url: string, fallbackText?: string, key: string = 'link') => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Link',
          fallbackText || `Please visit: ${url}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert(
        'Link',
        fallbackText || `Please visit: ${url}`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleEmailPress = async (email: string, key: string = 'email') => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const emailUrl = `mailto:${email}`;
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(
          'Contact',
          `Please email us at: ${email}`,
          [
            {
              text: 'Copy Email',
              onPress: async () => {
                if (Platform.OS === 'web' && navigator.clipboard) {
                  await navigator.clipboard.writeText(email);
                  Alert.alert('Copied!', 'Email address copied to clipboard.');
                }
              }
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Contact', `Please email us at: ${email}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ResponsiveScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info Section */}
        <View style={styles.section}>
          <View style={styles.appLogoContainer}>
            <View style={styles.appLogo}>
              <Text style={styles.appLogoText}>🌱</Text>
            </View>
            <Text style={styles.appName}>MyPlantScan</Text>
            <Text style={styles.appTagline}>AI-Powered Plant Care Assistant</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        {/* App Description */}
        <View style={styles.section}>
          <Text style={styles.description}>
            MyPlantScan uses cutting-edge artificial intelligence to help you identify plants, 
            diagnose health issues, and provide personalized care recommendations. Whether you are 
            a beginner gardener or an experienced botanist, our app makes plant care accessible 
            and enjoyable for everyone.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🔍</Text>
              </View>
              <Text style={styles.featureText}>AI-powered plant identification</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🏥</Text>
              </View>
              <Text style={styles.featureText}>Plant health analysis & diagnosis</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>🌿</Text>
              </View>
              <Text style={styles.featureText}>Personal plant garden management</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>💧</Text>
              </View>
              <Text style={styles.featureText}>Smart watering calculator</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>☀️</Text>
              </View>
              <Text style={styles.featureText}>Light meter for optimal placement</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>📊</Text>
              </View>
              <Text style={styles.featureText}>Detailed care recommendations</Text>
            </View>
          </View>
        </View>

        {/* Developer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Users size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Developed by</Text>
                <Text style={styles.infoValue}>MyPlantScan Team</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Globe size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Website</Text>
                <TouchableOpacity onPress={() => handleLinkPress('https://www.myplantscan.com')}>
                  <Text style={styles.linkText}>www.myplantscan.com</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Mail size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Contact</Text>
                <TouchableOpacity onPress={() => handleEmailPress('contact@myplantscan.com', 'contact-email')} disabled={loadingStates['contact-email']}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={styles.linkText}>contact@myplantscan.com</Text>
                    {loadingStates['contact-email'] && <ActivityIndicator size="small" color={Colors.primary} style={{marginLeft: 8}} />}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.legalButtons}>
            <TouchableOpacity
              style={styles.legalButton}
              onPress={() => handleLinkPress('https://www.myplantscan.com/privacy', 'Privacy Policy information will be available on our website.')}
            >
              <Shield size={20} color={Colors.primary} />
              <Text style={styles.legalButtonText}>Privacy Policy</Text>
              <ExternalLink size={16} color={Colors.gray500} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.legalButton}
              onPress={() => handleLinkPress('https://www.myplantscan.com/terms', 'Terms of Service information will be available on our website.')}
            >
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.legalButtonText}>Terms of Service</Text>
              <ExternalLink size={16} color={Colors.gray500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright Section */}
        <View style={styles.section}>
          <View style={styles.copyrightContainer}>
            <Text style={styles.copyrightText}>
              © 2024 MyPlantScan. All rights reserved.
            </Text>
            <Text style={styles.copyrightSubtext}>
              Made with <Heart size={12} color={Colors.error} /> for plant lovers everywhere
            </Text>
          </View>
        </View>
      </ResponsiveScrollView>
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
    borderBottomWidth: 1,
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  appLogoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appLogoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featuresList: {
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  legalButtons: {
    paddingHorizontal: 16,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  legalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  changelogContainer: {
    paddingHorizontal: 16,
  },
  changelogEntry: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    overflow: 'hidden',
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  changelogHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  versionTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  changelogVersion: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  changelogDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  changelogContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  changelogItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  changelogBullet: {
    fontSize: 16,
    color: Colors.primary,
    marginRight: 8,
    marginTop: 2,
  },
  changelogText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  copyrightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  copyrightSubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    flexDirection: 'row',
    alignItems: 'center',
  },
});