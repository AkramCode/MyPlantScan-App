import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { CheckCircle2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

const SIZE = 180;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FinalizingOnboarding() {
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let value = 0;
    const timer = setInterval(() => {
      value = Math.min(100, value + 2);
      setProgress(value);
      if (value >= 100) {
        clearInterval(timer);
        setTimeout(() => setIsReady(true), 350);
      }
    }, 60);
    return () => clearInterval(timer);
  }, []);

  const dashOffset = useMemo(() => {
    const pct = progress / 100;
    return CIRCUMFERENCE * (1 - pct);
  }, [progress]);

  const steps = [
    { key: 'analyze', label: 'Analyzing answers', threshold: 5 },
    { key: 'personalize', label: 'Personalizing features', threshold: 35 },
    { key: 'verify', label: 'Verifying data', threshold: 65 },
    { key: 'prepare', label: 'Preparing app', threshold: 95 },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}> 
      <StatusBar style="dark" />

      <View style={styles.progressContainer}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={Colors.gray200}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={Colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            fill="none"
          />
        </Svg>
        <View style={styles.progressLabelWrapper}>
          <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
        </View>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>Tailoring your experience</Text>
        <View style={styles.steps}>
          {steps.map((s, idx) => {
            const active = progress >= s.threshold;
            return (
              <View key={s.key} style={styles.stepRow}>
                <CheckCircle2 size={18} color={active ? Colors.primary : Colors.gray300} />
                <Text style={[styles.stepText, active ? styles.stepTextActive : styles.stepTextMuted]}> {s.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !isReady && styles.buttonDisabled]}
          disabled={!isReady}
          onPress={() => router.replace('/auth?mode=signup')}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // match onboarding background
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  progressLabelWrapper: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  steps: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 16,
  },
  stepTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  stepTextMuted: {
    color: Colors.gray500,
  },
  footer: {
    paddingBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
