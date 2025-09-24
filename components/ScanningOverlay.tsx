import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Sparkles, Leaf } from 'lucide-react-native';

interface ScanningOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
}

export default function ScanningOverlay({ 
  isVisible, 
  message = 'Analyzing plant...', 
  progress = 0 
}: ScanningOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Scanning line animation
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnimation.start();

      // Pulse animation for center icon
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Sparkle animation
      const sparkleAnimation = Animated.loop(
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      sparkleAnimation.start();

      return () => {
        scanAnimation.stop();
        pulseAnimation.stop();
        sparkleAnimation.stop();
      };
    } else {
      // Fade out overlay
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim, scanLineAnim, pulseAnim, sparkleAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  if (!isVisible) return null;

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-280, 280],
  });

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.background} />
      
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        
        <Animated.View 
          style={[
            styles.scanLine,
            {
              transform: [{ translateY: scanLineTranslateY }]
            }
          ]} 
        />
        
        <Animated.View 
          style={[
            styles.centerIcon,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <View style={styles.iconBackground}>
            <Leaf size={32} color="#22C55E" />
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sparkle,
            styles.sparkle1,
            {
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotation }]
            }
          ]}
        >
          <Sparkles size={16} color="#22C55E" />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sparkle,
            styles.sparkle2,
            {
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotation }]
            }
          ]}
        >
          <Sparkles size={12} color="#10B981" />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.sparkle,
            styles.sparkle3,
            {
              opacity: sparkleOpacity,
              transform: [{ rotate: sparkleRotation }]
            }
          ]}
        >
          <Sparkles size={14} color="#34D399" />
        </Animated.View>
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{message}</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { opacity: sparkleOpacity }]} />
          <Animated.View style={[styles.dot, { opacity: sparkleOpacity }]} />
          <Animated.View style={[styles.dot, { opacity: sparkleOpacity }]} />
        </View>
      </View>
      
      {progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#22C55E',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  centerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 40,
    right: 40,
  },
  sparkle2: {
    bottom: 60,
    left: 50,
  },
  sparkle3: {
    top: 80,
    left: 30,
  },
  statusContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  progressContainer: {
    marginTop: 24,
    alignItems: 'center',
    width: 200,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
  },
});