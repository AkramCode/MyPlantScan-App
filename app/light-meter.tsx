import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Sun,
  Lightbulb,
  Eye,
  Zap,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

type LightLevel = 'low' | 'medium' | 'bright' | 'direct';

interface LightReading {
  lux: number;
  level: LightLevel;
  recommendation: string;
  suitablePlants: string[];
  tips: string[];
}

export default function LightMeterScreen() {
  const insets = useSafeAreaInsets();
  const [isReading, setIsReading] = useState<boolean>(false);
  const [currentReading, setCurrentReading] = useState<LightReading | null>(null);
  const [animatedValue] = useState(new Animated.Value(0));
  const [readings, setReadings] = useState<number[]>([]);

  useEffect(() => {
    if (isReading) {
      const interval = setInterval(() => {
        // Simulate light sensor readings
        const mockLux = Math.floor(Math.random() * 50000) + 50;
        setReadings(prev => [...prev.slice(-9), mockLux]);
        
        const reading = analyzeLightLevel(mockLux);
        setCurrentReading(reading);
        
        // Animate the meter
        Animated.timing(animatedValue, {
          toValue: Math.min(mockLux / 50000, 1),
          duration: 500,
          useNativeDriver: false,
        }).start();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isReading, animatedValue]);

  const analyzeLightLevel = (lux: number): LightReading => {
    let level: LightLevel;
    let recommendation: string;
    let suitablePlants: string[];
    let tips: string[];

    if (lux < 200) {
      level = 'low';
      recommendation = 'Low Light - Suitable for shade-loving plants';
      suitablePlants = ['Snake Plant', 'ZZ Plant', 'Pothos', 'Peace Lily', 'Chinese Evergreen'];
      tips = [
        'Perfect for plants that prefer indirect light',
        'Avoid placing sun-loving plants here',
        'Consider grow lights for better plant growth',
        'Rotate plants weekly for even growth'
      ];
    } else if (lux < 1000) {
      level = 'medium';
      recommendation = 'Medium Light - Good for most houseplants';
      suitablePlants = ['Monstera', 'Fiddle Leaf Fig', 'Rubber Plant', 'Philodendron', 'Spider Plant'];
      tips = [
        'Ideal for most common houseplants',
        'Great spot for foliage plants',
        'Monitor plants for stretching toward light',
        'Perfect for plant propagation'
      ];
    } else if (lux < 10000) {
      level = 'bright';
      recommendation = 'Bright Light - Excellent for most plants';
      suitablePlants = ['Fiddle Leaf Fig', 'Bird of Paradise', 'Monstera', 'Alocasia', 'Calathea'];
      tips = [
        'Excellent for most houseplants',
        'Watch for signs of leaf burn on sensitive plants',
        'Perfect for flowering plants',
        'Great for plant growth and health'
      ];
    } else {
      level = 'direct';
      recommendation = 'Direct Sun - Best for sun-loving plants';
      suitablePlants = ['Succulents', 'Cacti', 'Aloe Vera', 'Jade Plant', 'String of Pearls'];
      tips = [
        'Perfect for succulents and cacti',
        'May be too intense for tropical plants',
        'Provide shade during hottest hours',
        'Ensure adequate watering for sun plants'
      ];
    }

    return { lux, level, recommendation, suitablePlants, tips };
  };

  const startReading = () => {
    setIsReading(true);
    setReadings([]);
    setCurrentReading(null);
  };

  const stopReading = () => {
    setIsReading(false);
  };

  const getLevelColor = (level: LightLevel): string => {
    switch (level) {
      case 'low': return '#6B7280';
      case 'medium': return '#F59E0B';
      case 'bright': return '#22C55E';
      case 'direct': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getLevelIcon = (level: LightLevel) => {
    switch (level) {
      case 'low': return Eye;
      case 'medium': return Lightbulb;
      case 'bright': return Sun;
      case 'direct': return Zap;
      default: return Eye;
    }
  };

  const formatLux = (lux: number): string => {
    if (lux >= 1000) {
      return `${(lux / 1000).toFixed(1)}k`;
    }
    return lux.toString();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Sun size={24} color="#F59E0B" />
          <Text style={styles.headerTitle}>Light Meter</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Measure light levels to find the perfect spot for your plants. Point your device toward the area you want to measure.
          </Text>

          {/* Light Meter Display */}
          <View style={styles.meterContainer}>
            <View style={styles.meterDisplay}>
              {currentReading ? (
                <>
                  <Text style={styles.luxValue}>{formatLux(currentReading.lux)}</Text>
                  <Text style={styles.luxUnit}>lux</Text>
                </>
              ) : (
                <>
                  <Text style={styles.luxValue}>--</Text>
                  <Text style={styles.luxUnit}>lux</Text>
                </>
              )}
            </View>
            
            {/* Animated Light Bar */}
            <View style={styles.lightBar}>
              <Animated.View
                style={[
                  styles.lightBarFill,
                  {
                    width: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: currentReading ? getLevelColor(currentReading.level) : '#E5E7EB',
                  },
                ]}
              />
            </View>
            
            {/* Light Level Labels */}
            <View style={styles.lightLabels}>
              <Text style={styles.lightLabel}>Low</Text>
              <Text style={styles.lightLabel}>Medium</Text>
              <Text style={styles.lightLabel}>Bright</Text>
              <Text style={styles.lightLabel}>Direct</Text>
            </View>
          </View>

          {/* Control Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isReading ? styles.stopButton : styles.startButton,
            ]}
            onPress={isReading ? stopReading : startReading}
          >
            {isReading ? (
              <>
                <View style={styles.stopIcon} />
                <Text style={styles.controlButtonText}>Stop Reading</Text>
              </>
            ) : (
              <>
                <Sun size={20} color="#FFFFFF" />
                <Text style={styles.controlButtonText}>Start Light Reading</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Current Reading Results */}
          {currentReading && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultHeader}>
                <View style={[styles.levelIndicator, { backgroundColor: getLevelColor(currentReading.level) }]}>
                  {React.createElement(getLevelIcon(currentReading.level), {
                    size: 20,
                    color: '#FFFFFF',
                  })}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultLevel}>{currentReading.level.toUpperCase()} LIGHT</Text>
                  <Text style={styles.resultRecommendation}>{currentReading.recommendation}</Text>
                </View>
              </View>

              {/* Suitable Plants */}
              <View style={styles.plantsSection}>
                <View style={styles.sectionHeader}>
                  <CheckCircle size={16} color="#22C55E" />
                  <Text style={styles.sectionTitle}>Suitable Plants</Text>
                </View>
                <View style={styles.plantsGrid}>
                  {currentReading.suitablePlants.map((plant, index) => (
                    <View key={`plant-${index}-${plant}`} style={styles.plantTag}>
                      <Text style={styles.plantTagText}>{plant}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tips */}
              <View style={styles.tipsSection}>
                <View style={styles.sectionHeader}>
                  <Info size={16} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Light Tips</Text>
                </View>
                {currentReading.tips.map((tip, index) => (
                  <Text key={`tip-${index}-${tip.slice(0, 10)}`} style={styles.tipText}>
                    • {tip}
                  </Text>
                ))}
              </View>

              {/* Reading History */}
              {readings.length > 0 && (
                <View style={styles.historySection}>
                  <View style={styles.sectionHeader}>
                    <TrendingUp size={16} color="#6B7280" />
                    <Text style={styles.sectionTitle}>Recent Readings</Text>
                  </View>
                  <View style={styles.historyChart}>
                    {readings.map((reading, index) => (
                      <View
                        key={`reading-${index}`}
                        style={[
                          styles.historyBar,
                          {
                            height: Math.max(4, (reading / 50000) * 60),
                            backgroundColor: getLevelColor(analyzeLightLevel(reading).level),
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.historyNote}>
                    Average: {Math.round(readings.reduce((a, b) => a + b, 0) / readings.length)} lux
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Light Level Guide */}
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>Light Level Guide</Text>
            
            <View style={styles.guideItem}>
              <View style={[styles.guideIndicator, { backgroundColor: '#6B7280' }]}>
                <Eye size={16} color="#FFFFFF" />
              </View>
              <View style={styles.guideContent}>
                <Text style={styles.guideLevel}>Low Light (0-200 lux)</Text>
                <Text style={styles.guideDescription}>Deep shade, away from windows</Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <View style={[styles.guideIndicator, { backgroundColor: '#F59E0B' }]}>
                <Lightbulb size={16} color="#FFFFFF" />
              </View>
              <View style={styles.guideContent}>
                <Text style={styles.guideLevel}>Medium Light (200-1000 lux)</Text>
                <Text style={styles.guideDescription}>Bright room, indirect sunlight</Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <View style={[styles.guideIndicator, { backgroundColor: '#22C55E' }]}>
                <Sun size={16} color="#FFFFFF" />
              </View>
              <View style={styles.guideContent}>
                <Text style={styles.guideLevel}>Bright Light (1000-10000 lux)</Text>
                <Text style={styles.guideDescription}>Near window, filtered sunlight</Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <View style={[styles.guideIndicator, { backgroundColor: '#EF4444' }]}>
                <Zap size={16} color="#FFFFFF" />
              </View>
              <View style={styles.guideContent}>
                <Text style={styles.guideLevel}>Direct Sun (10000+ lux)</Text>
                <Text style={styles.guideDescription}>Direct sunlight, south-facing window</Text>
              </View>
            </View>
          </View>

          {/* Warning Note */}
          <View style={styles.warningContainer}>
            <AlertTriangle size={16} color="#F59E0B" />
            <Text style={styles.warningText}>
              Note: This light meter uses your device&apos;s ambient light sensor and provides approximate readings. For precise measurements, use a dedicated light meter.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  headerRight: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  meterContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  meterDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  luxValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
  luxUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: -8,
  },
  lightBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  lightBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  lightLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  lightLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#F59E0B',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  levelIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultLevel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  resultRecommendation: {
    fontSize: 14,
    color: '#6B7280',
  },
  plantsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  plantTag: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  plantTagText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
  historySection: {
    marginBottom: 8,
  },
  historyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 2,
    marginBottom: 8,
  },
  historyBar: {
    flex: 1,
    borderRadius: 1,
    minHeight: 4,
  },
  historyNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  guideContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guideContent: {
    flex: 1,
  },
  guideLevel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  guideDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});