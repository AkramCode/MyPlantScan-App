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
  Animated,
  Dimensions,
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
  ArrowLeft,
  Shield,
  Lock,
} from 'lucide-react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '@/constants/colors';
import { markOnboardingComplete } from '@/lib/onboarding-storage';
import type { IconName, OnboardingSlide, QuizOption } from '@/constants/onboarding-slides';
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

type QuizChoiceProps = {
  option: QuizOption;
  isSelected: boolean;
  onSelect: () => void;
};

const QuizChoice: React.FC<QuizChoiceProps> = ({ option, isSelected, onSelect }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onSelect();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.quizOption,
          isSelected && styles.quizOptionSelected,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.quizOptionText,
          isSelected && styles.quizOptionTextSelected,
        ]}>
          {option.text}
        </Text>
        {isSelected && (
          <CheckCircle2 size={20} color={Colors.primary} strokeWidth={2.5} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

type OnboardingCardProps = {
  item: OnboardingSlide;
  width: number;
  index: number;
  permissionGranted: boolean;
  onRequestPermission: (type: 'camera' | 'library') => Promise<boolean>;
  onOpenSettings: () => void;
  selectedQuizOption?: string;
  onQuizOptionSelect?: (optionId: string) => void;
};

const OnboardingCard: React.FC<OnboardingCardProps> = ({
  item,
  width,
  index,
  permissionGranted,
  onRequestPermission,
  onOpenSettings,
  selectedQuizOption,
  onQuizOptionSelect,
}) => {
  const Icon = iconMap[item.icon];
  const showPermissionCta = Boolean(item.requiresPermission);
  const isQuizSlide = item.variant === 'quiz';

  return (
    <View style={[styles.slideContainer, { width }]}> 
      <View style={[styles.slideCard, isQuizSlide && styles.quizSlideCard]}> 
        <Image
          source={slideImages[index] ?? slideImages[slideImages.length - 1]}
          style={styles.slideImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />

        <View style={[styles.textContainer, isQuizSlide && styles.quizTextContainer]}>
          <Text style={[styles.slideTitle, isQuizSlide && styles.quizSlideTitle]}>
            {item.title}
          </Text>
          
          {/* Subtitles removed on quiz slides to keep content minimal and avoid overflow */}
          {item.subtitle && !isQuizSlide && (
            <Text style={styles.slideSubtitle}>
              {item.subtitle}
            </Text>
          )}
          
          <Text style={[styles.slideDescription, isQuizSlide && styles.quizSlideDescription]}>
            {item.description}
          </Text>
        </View>

        {isQuizSlide && item.quizOptions && item.quizQuestion && (
          <View style={styles.quizContainer}>
            <Text style={styles.quizQuestion}>{item.quizQuestion}</Text>
            <View style={styles.quizOptionsContainer}>
              {item.quizOptions.map((option) => (
                <QuizChoice
                  key={option.id}
                  option={option}
                  isSelected={selectedQuizOption === option.id}
                  onSelect={() => onQuizOptionSelect?.(option.id)}
                />
              ))}
            </View>
          </View>
        )}

        {showPermissionCta && (
          <View style={styles.permissionSection}>
            <View style={styles.permissionHeader}>
              <Shield size={24} color={Colors.primary} strokeWidth={2} />
              {item.permissionTitle && (
                <Text style={styles.permissionTitle}>{item.permissionTitle}</Text>
              )}
            </View>
            
            {item.permissionDescription && (
              <View style={styles.permissionDescContainer}>
                <Lock size={16} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.permissionDetails}>{item.permissionDescription}</Text>
              </View>
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
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
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
                <Text style={styles.settingsLinkText}>Open Device Settings</Text>
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
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

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
  const isQuizSlide = currentSlide.variant === 'quiz';
  const hasQuizAnswer = !isQuizSlide || quizAnswers[currentSlide.key];

  const handleQuizOptionSelect = useCallback((slideKey: string, optionId: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [slideKey]: optionId,
    }));
  }, []);

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
      router.replace('/onboarding/finalizing');
    }
  }, [isCompleting]);

  const handleNext = useCallback(() => {
    if (requiredPermission && !currentPermissionGranted) {
      Alert.alert('Permission required', 'Please grant the required permission to continue.', [{ text: 'OK', style: 'default' }]);
      return;
    }

    if (isQuizSlide && !hasQuizAnswer) {
      Alert.alert('Make a selection', 'Choose an option to personalize your experience.', [{ text: 'OK', style: 'default' }]);
      return;
    }

    if (isLastSlide) {
      void completeOnboarding();
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  }, [completeOnboarding, currentIndex, currentPermissionGranted, isLastSlide, requiredPermission, isQuizSlide, hasQuizAnswer]);

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
          selectedQuizOption={quizAnswers[item.key]}
          onQuizOptionSelect={(optionId) => handleQuizOptionSelect(item.key, optionId)}
        />
      );
    },
    [
      cameraPermissionGranted,
      handleOpenSettings,
      handleRequestPermission,
      libraryPermissionGranted,
      width,
      quizAnswers,
      handleQuizOptionSelect,
    ]
  );

  const isContinueDisabled =
    isCompleting || 
    (requiredPermission ? !currentPermissionGranted : false) ||
    (isQuizSlide ? !hasQuizAnswer : false);

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
          <ArrowLeft size={24} color={currentIndex === 0 ? Colors.gray400 : Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {totalSlides}
          </Text>
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
            {isLastSlide ? 'Start' : 'Continue'}
          </Text>
          {!isLastSlide && <ArrowRight size={20} color={Colors.white} strokeWidth={2.5} />}
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
    paddingVertical: 8,
    borderRadius: 12,
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
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressTrack: {
    width: '100%',
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
    paddingVertical: 8,
    justifyContent: 'space-between', // keeps content above bottom nav
  },
  slideCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 20,
  },
  quizSlideCard: {
    gap: 8,
    paddingVertical: 12,
  },
  slideImage: {
    width: '100%',
    height: 320,
    marginTop: 2,
    marginHorizontal: 2,
  },
  // Removed quiz-specific image reduction to honor full artwork size on all slides
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  quizTextContainer: {
    gap: 4,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  quizSlideTitle: {
    fontSize: 22,
  },
  slideSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  quizSlideSubtitle: {
    fontSize: 17,
  },
  slideDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  quizSlideDescription: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  quizContainer: {
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  quizQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  quizOptionsContainer: {
    gap: 8,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quizOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  quizOptionEmoji: {
    fontSize: 20,
  },
  quizOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  quizOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  permissionSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 16,
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  permissionDescContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  permissionDetails: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    gap: 10,
    minWidth: 240,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionButtonGranted: {
    backgroundColor: Colors.success,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  settingsLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    paddingTop: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 18,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.2,
  },
});



