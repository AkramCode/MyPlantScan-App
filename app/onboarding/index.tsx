import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  ArrowRight,
  CalendarCheck,
  Camera as CameraIcon,
  CheckCircle2,
  Cloud,
  HeartPulse,
  Image as ImageIcon,
  Leaf,
  Library,
  Scan,
  Sparkles,
} from 'lucide-react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '@/constants/colors';
import { markOnboardingComplete } from '@/lib/onboarding-storage';
import type { IconName, OnboardingSlide } from '@/constants/onboarding-slides';
import { slides } from '@/constants/onboarding-slides';

const iconMap: Record<IconName, LucideIcon> = {
  Sparkles,
  Scan,
  HeartPulse,
  Camera: CameraIcon,
  Image: ImageIcon,
  Leaf,
  Library,
  CalendarCheck,
  Cloud,
  CheckCircle2,
};

// Preload artwork 1..10 from assets/onboarding
const slideImages = [
  require('@/assets/onboarding/1.webp'),
  require('@/assets/onboarding/2.webp'),
  require('@/assets/onboarding/3.webp'),
  require('@/assets/onboarding/4.webp'),
  require('@/assets/onboarding/5.webp'),
  require('@/assets/onboarding/6.webp'),
  require('@/assets/onboarding/7.webp'),
  require('@/assets/onboarding/8.webp'),
  require('@/assets/onboarding/9.webp'),
  require('@/assets/onboarding/10.webp'),
] as const;

type OnboardingCardProps = {
  item: OnboardingSlide;
  width: number;
  index: number;
  permissionGranted: boolean;
  onRequestPermission: (type: 'camera' | 'library') => Promise<boolean>;
  onOpenSettings: () => void;
};

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  item,
  width,
  index,
  permissionGranted,
  onRequestPermission,
  onOpenSettings,
}) => {
  const Icon = iconMap[item.icon];
  const showPermissionCta = Boolean(item.requiresPermission);

  return (
    <View style={[styles.slideContainer, { width }]}> 
      <View style={styles.slideCard}>
        <Image
          source={slideImages[index] ?? slideImages[slideImages.length - 1]}
          style={styles.slideImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />

        <Text style={styles.slideTitle}>
          {item.title}
        </Text>
        {/* description hidden per request */}

        {showPermissionCta && (
          <View style={styles.permissionSection}>
            {item.permissionTitle && (
              <Text style={styles.permissionTitle}>{item.permissionTitle}</Text>
            )}
            {item.permissionDescription && (
              <Text style={styles.permissionDetails}>{item.permissionDescription}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.permissionButton,
                permissionGranted && styles.permissionButtonGranted,
              ]}
              onPress={() => {
                if (item.requiresPermission) {
                  void onRequestPermission(item.requiresPermission);
                }
              }}
              disabled={permissionGranted}
              accessibilityRole="button"
              accessibilityHint={
                permissionGranted
                  ? 'Permission already granted'
                  : 'Request the required permission'
              }
            >
              {permissionGranted ? (
                <>
                  <CheckCircle2 size={18} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.permissionButtonText}>Permission enabled</Text>
                </>
              ) : (
                <>
                  <Text style={styles.permissionButtonText}>Grant access</Text>
                  <ArrowRight size={18} color={Colors.white} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>

            {!permissionGranted && (
              <TouchableOpacity
                onPress={onOpenSettings}
                style={styles.settingsLink}
                accessibilityRole="button"
                accessibilityLabel="Open device settings to manage permissions"
              >
                <Text style={styles.settingsLinkText}>Open device settings</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const appState = useRef(AppState.currentState);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [libraryPermissionGranted, setLibraryPermissionGranted] = useState(false);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex];
  const requiredPermission = currentSlide.requiresPermission;
  const currentPermissionGranted =
    requiredPermission === 'camera'
      ? cameraPermissionGranted
      : requiredPermission === 'library'
      ? libraryPermissionGranted
      : true;
  const isLastSlide = currentIndex === totalSlides - 1;

  const syncPermissions = useCallback(async () => {
    try {
      const [camera, library] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
      ]);

      setCameraPermissionGranted(camera.granted);
      setLibraryPermissionGranted(library.granted);
    } catch (error) {
      console.error('Onboarding: permission sync failed', error);
    }
  }, []);

  useEffect(() => {
    void syncPermissions();
  }, [syncPermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        void syncPermissions();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [syncPermissions]);

  useEffect(() => {
    listRef.current?.scrollToIndex({ index: currentIndex, animated: false });
  }, [width, currentIndex]);

  const handleOpenSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const handleRequestPermission = useCallback(async (type: 'camera' | 'library') => {
    try {
      if (type === 'camera') {
        const result = await Camera.requestCameraPermissionsAsync();
        setCameraPermissionGranted(result.granted);

        if (!result.granted) {
          Alert.alert(
            'Camera access is required',
            'Enable camera access in your device settings to scan plants in real time.'
          );
        }

        return result.granted;
      }

      const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setLibraryPermissionGranted(result.granted);

      if (!result.granted) {
        Alert.alert(
          'Photo access is required',
          'Allow photo library access in settings to analyse saved plant images.'
        );
      }

      return result.granted;
    } catch (error) {
      console.error('Onboarding: permission request error', error);
      Alert.alert(
        'Unable to request permission',
        'Please try again or update the permission from your device settings.'
      );
      return false;
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (isCompleting) {
      return;
    }

    setIsCompleting(true);
    try {
      await markOnboardingComplete();
    } catch (error) {
      console.error('Onboarding: completion error', error);
    } finally {
      router.replace('/auth');
    }
  }, [isCompleting]);

  const handleNext = useCallback(() => {
    if (requiredPermission && !currentPermissionGranted) {
      Alert.alert(
        'Grant permission to continue',
        'Please enable the required permission before moving forward.'
      );
      return;
    }

    if (isLastSlide) {
      void completeOnboarding();
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [completeOnboarding, currentIndex, currentPermissionGranted, isLastSlide, requiredPermission]);

  const handlePrevious = useCallback(() => {
    if (currentIndex === 0) {
      return;
    }

    const previousIndex = currentIndex - 1;
    setCurrentIndex(previousIndex);
    listRef.current?.scrollToIndex({ index: previousIndex, animated: true });
  }, [currentIndex]);

  const renderItem = useCallback(
    ({ item, index: _index }: { item: OnboardingSlide; index: number }) => {
      const permissionGrantedForSlide =
        item.requiresPermission === 'camera'
          ? cameraPermissionGranted
          : item.requiresPermission === 'library'
          ? libraryPermissionGranted
          : true;

      return (
        <OnboardingCard
          item={item}
          width={width}
          index={_index}
          permissionGranted={permissionGrantedForSlide}
          onRequestPermission={handleRequestPermission}
          onOpenSettings={handleOpenSettings}
        />
      );
    },
    [
      cameraPermissionGranted,
      handleOpenSettings,
      handleRequestPermission,
      libraryPermissionGranted,
      width,
    ]
  );

  const isContinueDisabled =
    isCompleting || (requiredPermission ? !currentPermissionGranted : false);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.headerBackButton,
            currentIndex === 0 && styles.headerBackButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          accessibilityRole="button"
          accessibilityLabel="Go to previous step"
          accessibilityState={{ disabled: currentIndex === 0 }}
        >
          <Text style={styles.headerBackLabel}>{'<'}</Text>
        </TouchableOpacity>

        <View style={styles.progressIndicator}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / totalSlides) * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        style={styles.slidesList}
        contentContainerStyle={styles.slidesContent}
      />

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: currentSlide.accent },
            isContinueDisabled && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={isContinueDisabled}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Finish onboarding' : 'Continue to next step'}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Continue'}
          </Text>
          <ArrowRight size={20} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
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
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  headerBackButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBackLabel: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  headerBackButtonDisabled: {
    opacity: 0.4,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  slidesList: {
    flex: 1,
  },
  slidesContent: {
    flexGrow: 1,
  },
  slideContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  slideCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 24,
  },
  iconBadge: {
    display: 'none',
  },
  slideImage: {
    width: '100%',
    height: 340,
    marginTop: 6,
    marginHorizontal: 2,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  slideDescription: {
    display: 'none',
  },
  permissionSection: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  permissionDetails: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 26,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    gap: 10,
    minWidth: 220,
  },
  permissionButtonGranted: {
    backgroundColor: Colors.success,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  settingsLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  settingsLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 18,
    width: '100%',
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.2,
  },
});



