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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
  BookOpen,
  ClipboardCheck,
  Cloud,
  Droplets,
  HeartPulse,
  Rocket,
  Scan,
  ShieldCheck,
  Sprout,
  SunMedium,
} from 'lucide-react-native';

import { Colors } from '@/constants/colors';
import { markOnboardingComplete } from '@/lib/onboarding-storage';
import { slides, IconName, OnboardingSlide } from './slides';

const iconMap: Record<IconName, LucideIcon> = {
  Scan,
  HeartPulse,
  Sprout,
  Droplets,
  SunMedium,
  ClipboardCheck,
  BookOpen,
  Cloud,
  ShieldCheck,
  Rocket,
};

type OnboardingCardProps = {
  item: OnboardingSlide;
  width: number;
};

const OnboardingCard: React.FC<OnboardingCardProps> = ({ item, width }) => {
  const Icon = iconMap[item.icon];

  return (
    <View style={[styles.slide, { width }]}> 
      <View style={[styles.iconBadge, { backgroundColor: item.accent }]}> 
        <Icon size={32} color={Colors.white} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );
};

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

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

  const handleSkip = useCallback(() => {
    void completeOnboarding();
  }, [completeOnboarding]);

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

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <StatusBar style='dark' />

      <View style={styles.headerRow}>
        <Text style={styles.brand}>MyPlantScan</Text>
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel='Skip onboarding'
          onPress={handleSkip}
          disabled={isCompleting}
        >
          <Text style={[styles.skipText, isCompleting && styles.disabledText]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <OnboardingCard item={item} width={width} />}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.progressWrapper}>
        <Text style={styles.stepText}>{`${currentIndex + 1} / ${slides.length}`}</Text>
        <View style={styles.dotsRow}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                index === currentIndex ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.actionsRow}>
        {currentIndex > 0 ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePrevious}
            accessibilityRole='button'
            accessibilityLabel='Go to previous onboarding slide'
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.secondaryButtonPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.primaryButton, isCompleting && styles.primaryButtonDisabled]}
          onPress={handleNext}
          disabled={isCompleting}
          accessibilityRole='button'
          accessibilityLabel={isLastSlide ? 'Finish onboarding' : 'Go to next onboarding slide'}
        >
          <Text style={styles.primaryButtonText}>{isLastSlide ? 'Start exploring' : 'Next'}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  disabledText: {
    opacity: 0.4,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingTop: 32,
  },
  slide: {
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  progressWrapper: {
    alignItems: 'center',
    marginTop: 32,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray300,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 32,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.surface,
  },
  secondaryButtonPlaceholder: {
    width: 120,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  primaryButton: {
    flex: 1,
    marginLeft: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});



