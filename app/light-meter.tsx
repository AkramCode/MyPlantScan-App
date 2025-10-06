import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { LightSensor } from 'expo-sensors';
import * as Brightness from 'expo-brightness';
import {
  Info,
  X,
  Lightbulb,
  Camera,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

type LightLevel = 'Dark for plants' | 'Low light' | 'Medium light' | 'Bright light' | 'Very bright';
type MeasurementMethod = 'sensor' | 'camera' | 'brightness' | 'manual';

interface LightReading {
  lux: number;
  level: LightLevel;
  description: string;
  method: MeasurementMethod;
}

export default function LightMeterScreen() {
  const insets = useSafeAreaInsets();
  const [isReading, setIsReading] = useState<boolean>(false);
  const [currentReading, setCurrentReading] = useState<LightReading | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [unit, setUnit] = useState<'Lux' | 'FC'>('Lux');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [measurementMethod, setMeasurementMethod] = useState<MeasurementMethod>('sensor');
  const showComingSoon = true;
  const sensorSubscription = useRef<ReturnType<typeof LightSensor.addListener> | null>(null);
  const readingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawReadings = useRef<number[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initializeLightMeter = async () => {
      try {
        // Determine best measurement method for platform
        if (Platform.OS === 'android') {
          // Try Android light sensor first
          const available = await LightSensor.isAvailableAsync();
          if (available) {
            const permission = await LightSensor.getPermissionsAsync();
            if (permission.granted || (await LightSensor.requestPermissionsAsync()).granted) {
              if (isMounted) {
                setSensorAvailable(true);
                setMeasurementMethod('sensor');
                return;
              }
            }
          }
        }
        
        // For iOS or if Android sensor fails, use brightness estimation
        if (isMounted) {
          if (Platform.OS === 'ios') {
            setMeasurementMethod('brightness');
            setSensorAvailable(true);
          } else {
            // Android fallback to brightness
            setMeasurementMethod('brightness');
            setSensorAvailable(true);
          }
        }
      } catch {
        if (isMounted) {
          setMeasurementMethod('manual');
          setSensorAvailable(false);
          setErrorMessage('Automatic light measurement not available - manual mode only');
        }
      }
    };

    initializeLightMeter();

    return () => {
      isMounted = false;
      cleanupSensor();
    };
  }, []);

  const cleanupSensor = () => {
    if (sensorSubscription.current) {
      sensorSubscription.current.remove();
      sensorSubscription.current = null;
    }
    if (readingTimeout.current) {
      clearTimeout(readingTimeout.current);
      readingTimeout.current = null;
    }
    rawReadings.current = [];
  };

  const estimateLightFromBrightness = async (): Promise<number> => {
    try {
      const brightness = await Brightness.getBrightnessAsync();
      // Convert brightness (0-1) to estimated lux
      // Indoor lighting typically ranges from 50-2000 lux
      // This is a rough estimation based on screen brightness
      const estimatedLux = Math.round(brightness * 1000 + 50);
      return estimatedLux;
    } catch {
      return 300; // Default fallback value
    }
  };

  const measureWithCamera = async (): Promise<number> => {
    // This would require camera frame analysis
    // For now, we'll use brightness as a proxy
    return estimateLightFromBrightness();
  };

  const measureLightLevel = async (): Promise<{ lux: number; method: MeasurementMethod }> => {
    switch (measurementMethod) {
      case 'sensor':
        // Will be handled by existing sensor logic
        return { lux: 0, method: 'sensor' };
      
      case 'camera':
        const cameraLux = await measureWithCamera();
        return { lux: cameraLux, method: 'camera' };
      
      case 'brightness':
        const brightnessLux = await estimateLightFromBrightness();
        return { lux: brightnessLux, method: 'brightness' };
      
      default:
        return { lux: 300, method: 'manual' };
    }
  };

  const analyzeLightLevel = (lux: number, method: MeasurementMethod): LightReading => {
    let level: LightLevel;
    let description: string;

    // More accurate thresholds based on plant care research
    if (lux < 25) {
      level = 'Dark for plants';
      description = 'Too dark for most plants - move closer to light';
    } else if (lux < 200) {
      level = 'Low light';
      description = 'Suitable for snake plants, ZZ plants, pothos';
    } else if (lux < 800) {
      level = 'Medium light';
      description = 'Good for most houseplants like peace lily, philodendron';
    } else if (lux < 2000) {
      level = 'Bright light';
      description = 'Excellent for rubber trees, fiddle leaf figs';
    } else {
      level = 'Very bright';
      description = 'Perfect for cacti, succulents, herbs';
    }

    return { lux, level, description, method };
  };

  const startReading = async () => {
    if (measurementMethod === 'sensor' && Platform.OS === 'android') {
      return startSensorReading();
    } else {
      return startAlternativeReading();
    }
  };

  const startSensorReading = async () => {
    try {
      cleanupSensor();
      setErrorMessage(null);
      
      LightSensor.setUpdateInterval(50);
      setIsReading(true);
      setShowResult(false);
      setCurrentReading(null);
      rawReadings.current = [];

      let readingCount = 0;
      const maxReadings = 40;
      
      sensorSubscription.current = LightSensor.addListener((measurement) => {
        const lux = typeof measurement.illuminance === 'number' && Number.isFinite(measurement.illuminance)
          ? Math.max(0, measurement.illuminance)
          : 0;
        
        rawReadings.current.push(lux);
        readingCount++;
        
        if (readingCount % 5 === 0 && rawReadings.current.length >= 5) {
          const recentAvg = rawReadings.current.slice(-5).reduce((a, b) => a + b, 0) / 5;
          const tempReading = analyzeLightLevel(Math.round(recentAvg), 'sensor');
          setCurrentReading(tempReading);
        }
        
        if (readingCount >= maxReadings) {
          finalizeSensorMeasurement();
        }
      });

      readingTimeout.current = setTimeout(() => {
        finalizeSensorMeasurement();
      }, 4000);
    } catch {
      setIsReading(false);
      setErrorMessage('Failed to start light measurement');
      Alert.alert('Error', 'Failed to start light measurement. Please try again.');
    }
  };

  const startAlternativeReading = async () => {
    try {
      setIsReading(true);
      setShowResult(false);
      setCurrentReading(null);
      setErrorMessage(null);
      
      // Simulate measurement time for consistency
      setTimeout(async () => {
        const { lux, method } = await measureLightLevel();
        const reading = analyzeLightLevel(lux, method);
        setCurrentReading(reading);
        setIsReading(false);
        setShowResult(true);
      }, 2000);
    } catch {
      setIsReading(false);
      setErrorMessage('Failed to measure light level');
      Alert.alert('Error', 'Failed to measure light level. Please try again.');
    }
  };

  const finalizeSensorMeasurement = () => {
    if (rawReadings.current.length === 0) {
      setIsReading(false);
      setErrorMessage('No readings collected');
      return;
    }

    // Remove outliers using interquartile range method
    const sorted = [...rawReadings.current].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const filteredReadings = rawReadings.current.filter(
      lux => lux >= lowerBound && lux <= upperBound
    );
    
    // Calculate final average
    const finalLux = filteredReadings.length > 0 
      ? filteredReadings.reduce((a, b) => a + b, 0) / filteredReadings.length
      : rawReadings.current.reduce((a, b) => a + b, 0) / rawReadings.current.length;
    
    const reading = analyzeLightLevel(Math.round(finalLux), 'sensor');
    setCurrentReading(reading);
    setIsReading(false);
    setShowResult(true);
    cleanupSensor();
  };

  const resetReading = () => {
    setCurrentReading(null);
    setShowResult(false);
    setIsReading(false);
    setErrorMessage(null);
    cleanupSensor();
  };

  const getInstructionText = (): string => {
    switch (measurementMethod) {
      case 'sensor':
        return 'Point device toward light source for best accuracy';
      case 'camera':
        return 'Camera will analyze brightness - point toward light source';
      case 'brightness':
        return 'Using screen brightness to estimate light level';
      case 'manual':
        return 'Manual mode - estimate light level based on surroundings';
      default:
        return 'Light measurement ready';
    }
  };

  const getMethodIcon = (method: MeasurementMethod) => {
    switch (method) {
      case 'sensor':
        return <Lightbulb size={14} color="#666" />;
      case 'camera':
        return <Camera size={14} color="#666" />;
      case 'brightness':
        return <Lightbulb size={14} color="#666" />;
      default:
        return <Info size={14} color="#666" />;
    }
  };

  const getMethodLabel = (method: MeasurementMethod): string => {
    switch (method) {
      case 'sensor':
        return 'Light Sensor';
      case 'camera':
        return 'Camera Analysis';
      case 'brightness':
        return 'Brightness Estimation';
      case 'manual':
        return 'Manual Estimation';
      default:
        return 'Unknown Method';
    }
  };;

  const convertToFC = (lux: number): number => {
    return Math.round(lux * 0.0929);
  };

  const formatValue = (lux: number): string => {
    if (unit === 'FC') {
      return convertToFC(lux).toString();
    }
    return lux.toString();
  };

  const handleStart = async () => {
    if (sensorAvailable === false && measurementMethod === 'manual') {
      Alert.alert(
        'Manual Mode',
        'Automatic light measurement is not available on this device. Please estimate the light level manually.',
      );
      return;
    }
    
    if (!showResult) {
      setShowInstructions(true);
    } else {
      resetReading();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
        >
          <X size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Light Meter</Text>
        </View>
        
        <View style={styles.headerButton} />
      </View>

      {/* Instruction Banner */}
      <View style={[styles.instructionBanner, errorMessage && styles.errorBanner]}>
        <Info size={16} color={errorMessage ? "#EF4444" : "#22C55E"} />
        <Text style={[styles.instructionText, errorMessage && styles.errorText]}>
          {errorMessage || getInstructionText()}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Unit Selector */}
        <View style={styles.unitSelector}>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'Lux' && styles.unitButtonActive]}
            onPress={() => setUnit('Lux')}
          >
            <Text style={[styles.unitText, unit === 'Lux' && styles.unitTextActive]}>Lux</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, unit === 'FC' && styles.unitButtonActive]}
            onPress={() => setUnit('FC')}
          >
            <Text style={[styles.unitText, unit === 'FC' && styles.unitTextActive]}>FC</Text>
          </TouchableOpacity>
        </View>

        {/* Light Reading Display */}
        <View style={styles.readingContainer}>
          {isReading ? (
            <Text style={styles.readingValue}>...</Text>
          ) : currentReading ? (
            <Text style={styles.readingValue}>{formatValue(currentReading.lux)}</Text>
          ) : (
            <Text style={styles.readingValue}>--</Text>
          )}
        </View>

        {/* Result Section */}
        {showResult && currentReading && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Light Level Assessment</Text>
            <Text style={styles.resultLevel}>{currentReading.level}</Text>
            <Text style={styles.resultDescription}>{currentReading.description}</Text>
            <View style={styles.methodIndicator}>
              {getMethodIcon(currentReading.method)}
              <Text style={styles.methodText}>{getMethodLabel(currentReading.method)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {showResult ? (
          <TouchableOpacity style={styles.resetButton} onPress={resetReading}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start Measuring</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowInstructions(true)}
        >
          <Text style={styles.helpButtonText}>How to Use Light Meter?</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions Modal */}
      <Modal visible={showInstructions} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How to Use Light Meter?</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowInstructions(false)}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Keep the front camera pointed at the light source.</Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Move the phone around the plant to measure light exposure from all angles.</Text>
            </View>

            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>It&apos;s best to check light level during mid-day for more accurate result.</Text>
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                setShowInstructions(false);
                startReading();
              }}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Coming Soon Modal */}
      <Modal visible={showComingSoon} transparent animationType="fade">
        <View style={styles.comingSoonOverlay}>
          <View style={styles.comingSoonContent}>
            <View style={styles.comingSoonIcon}>
              <Lightbulb size={48} color="#22C55E" />
            </View>
            
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            
            <Text style={styles.comingSoonDescription}>
              We&apos;re working hard to bring you the most accurate light meter for your plants. 
              This feature will be available in a future update.
            </Text>
            
            <TouchableOpacity
              style={styles.comingSoonButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
            >
              <Text style={styles.comingSoonButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
  },
  instructionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
    flex: 1,
  },
  errorText: {
    color: '#EF4444',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
    borderRadius: 20,
    padding: 4,
    marginBottom: 40,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  unitButtonActive: {
    backgroundColor: '#FFF',
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  unitTextActive: {
    color: '#000',
  },
  readingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  readingValue: {
    fontSize: 80,
    fontWeight: '300',
    color: '#000',
  },
  resultSection: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  resultLevel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  methodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  methodText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  startButton: {
    backgroundColor: '#22C55E',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    borderColor: '#22C55E',
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButtonText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
  },
  helpButton: {
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  continueButton: {
    backgroundColor: '#22C55E',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  comingSoonIcon: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 50,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  comingSoonButton: {
    backgroundColor: '#22C55E',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  comingSoonButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});