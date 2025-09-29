import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  Sparkles,
  Scan,
  HeartPulse,
  Camera,
  Image as ImageIcon,
  Library,
  CalendarCheck,
  Cloud,
  CheckCircle2,
  Leaf,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '@/constants/colors';
import { markOnboardingComplete } from '@/lib/onboarding-storage';
import { slides, IconName, OnboardingSlide } from './slides';

const iconMap: Record<IconName, LucideIcon> = {
  Sparkles,
  Scan,
  HeartPulse,
  Camera,
  Image: ImageIcon,
  Library,
  CalendarCheck,
  Cloud,
  CheckCircle2,
  Leaf,
};

type OnboardingCardProps = {
  item: OnboardingSlide;
  width: number;
  onRequestPermission: (type: 'camera' | 'library') => void;
  permissionGranted: boolean;
};

const OnboardingCard: React.FC<OnboardingCardProps> = ({ 
  item, 
  width, 
  onRequestPermission,
  permissionGranted 
}) => {
  const Icon = iconMap[item.icon];

  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconBadge, { backgroundColor: item.accent }]}>
          <Icon size={40} color={Colors.white} strokeWidth={2} />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>

        {item.requiresPermission && (
          <View style={styles.permissionSection}>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                permissionGranted && styles.permissionButtonGranted,
              ]}
              onPress={() => !permissionGranted && onRequestPermission(item.requiresPermission!)}
              disabled={permissionGranted}
            >
              {permissionGranted ? (
                <>
                  <CheckCircle2 size={20} color={Colors.white} strokeWidth={2.5} />
                  <Text style={styles.permissionButtonText}>Access Granted</Text>
                </>
              ) : (
                <>
                  <Text style={styles.permissionButtonText}>
                    Grant {item.requiresPermission === 'camera' ? 'Camera' : 'Photo Library'} Access
                  </Text>
                  <ArrowRight size={20} color={Colors.white} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
            {!permissionGranted && (
              <Text style={styles.permissionNote}>
                Required to use all features
              </Text>
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [libraryPermission, setLibraryPermission] = useState<boolean>(false);

  // Check library permission on mount
  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      setLibraryPermission(status === 'granted');
    })();
  }, []);

  const handleRequestPermission = useCallback(async (type: 'camera' | 'library') => {
    try {
      if (type === 'camera') {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert(
            'Permission Required',
            'Camera access is needed to identify plants. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
        }
      } else {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setLibraryPermission(result.granted);
        if (!result.granted) {
          Alert.alert(
            'Permission Required',
            'Photo library access helps you identify plants from existing photos. Please enable it in your device settings.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  }, [requestCameraPermission]);

  const completeOnboarding = useCallback(async () => {
    if (isCompleting) {
      return;
    }

    setIsCompleting(true);
    try {
      await markOnboardingComplete();
    } catch (error) {
      console.error('Onboarding: complete error', error);
    } finally {
      router.replace('/(tabs)');
    }
  }, [isCompleting]);

  const handleNext = useCallback(() => {
    if (currentIndex >= slides.length - 1) {
      void completeOnboarding();
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [completeOnboarding, currentIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex === 0) {
      return;
    }

    const previousIndex = currentIndex - 1;
    setCurrentIndex(previousIndex);
    listRef.current?.scrollToIndex({ index: previousIndex, animated: true });
  }, [currentIndex]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
      if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < slides.length) {
        setCurrentIndex(nextIndex);
      }
    },
    [currentIndex, width]
  );

  const isLastSlide = currentIndex === slides.length - 1;
  const currentSlide = slides[currentIndex];
  
  // Check if current permission slide has granted permission
  const currentPermissionGranted = 
    currentSlide.requiresPermission === 'camera' 
      ? cameraPermission?.granted ?? false
      : currentSlide.requiresPermission === 'library'
      ? libraryPermission
      : true;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      <StatusBar style='dark' />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brandText}>MyPlantScan</Text>
        <View style={styles.progressIndicator}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentIndex + 1) / slides.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {slides.length}
          </Text>
        </View>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <OnboardingCard 
            item={item} 
            width={width}
            onRequestPermission={handleRequestPermission}
            permissionGranted={
              item.requiresPermission === 'camera' 
                ? cameraPermission?.granted ?? false
                : item.requiresPermission === 'library'
                ? libraryPermission
                : true
            }
          />
        )}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.slidesList}
      />

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((slide, index) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
              index === currentIndex && { backgroundColor: currentSlide.accent },
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrevious}
            accessibilityRole='button'
            accessibilityLabel='Go to previous screen'
          >
            <ArrowLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: currentSlide.accent },
            isCompleting && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={isCompleting}
          accessibilityRole='button'
          accessibilityLabel={isLastSlide ? 'Get started' : 'Continue to next screen'}
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
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
  slidesList: {
    flexGrow: 0,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  slideDescription: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  permissionSection: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 240,
  },
  permissionButtonGranted: {
    backgroundColor: Colors.success,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  permissionNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray300,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 160,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
});
