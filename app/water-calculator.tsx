import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Droplets,
  Thermometer,
  Wind,
  Calendar,
  Info,
  Save,
  Calculator,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

type PlantType = 'succulent' | 'tropical' | 'flowering' | 'foliage' | 'herb' | 'fern';
type PotSize = 'small' | 'medium' | 'large' | 'xlarge';
type Season = 'spring' | 'summer' | 'fall' | 'winter';
type SoilType = 'well-draining' | 'moisture-retaining' | 'sandy' | 'clay';
type Environment = 'indoor' | 'outdoor' | 'greenhouse';

interface WateringResult {
  frequency: number;
  amount: string;
  amountMl: number;
  tips: string[];
  schedule: string;
  rationale: string[];
}

export default function WaterCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const [plantType, setPlantType] = useState<PlantType>('foliage');
  const [potSize, setPotSize] = useState<PotSize>('medium');
  const [season, setSeason] = useState<Season>('spring');
  const [soilType, setSoilType] = useState<SoilType>('well-draining');
  const [environment, setEnvironment] = useState<Environment>('indoor');
  const [temperature, setTemperature] = useState<string>('22');
  const [humidity, setHumidity] = useState<string>('50');
  const [result, setResult] = useState<WateringResult | null>(null);

  const plantTypes = [
    { key: 'succulent', label: 'Succulent/Cactus', icon: 'ðŸŒµ' },
    { key: 'tropical', label: 'Tropical Plants', icon: 'ðŸŒ´' },
    { key: 'flowering', label: 'Flowering Plants', icon: 'ðŸŒ¸' },
    { key: 'foliage', label: 'Foliage Plants', icon: 'ðŸŒ¿' },
    { key: 'herb', label: 'Herbs', icon: 'ðŸŒ±' },
    { key: 'fern', label: 'Ferns', icon: 'ðŸŒ¿' },
  ];

  const potSizes = [
    { key: 'small', label: 'Small (4-6")', multiplier: 0.7 },
    { key: 'medium', label: 'Medium (6-10")', multiplier: 1.0 },
    { key: 'large', label: 'Large (10-14")', multiplier: 1.4 },
    { key: 'xlarge', label: 'Extra Large (14"+)', multiplier: 1.8 },
  ];

  const seasons = [
    { key: 'spring', label: 'Spring', multiplier: 1.2 },
    { key: 'summer', label: 'Summer', multiplier: 1.5 },
    { key: 'fall', label: 'Fall', multiplier: 0.8 },
    { key: 'winter', label: 'Winter', multiplier: 0.6 },
  ];

  const soilTypes = [
    { key: 'well-draining', label: 'Well-draining', multiplier: 1.0 },
    { key: 'moisture-retaining', label: 'Moisture-retaining', multiplier: 0.7 },
    { key: 'sandy', label: 'Sandy', multiplier: 1.3 },
    { key: 'clay', label: 'Clay', multiplier: 0.5 },
  ];

  const environments = [
    { key: 'indoor', label: 'Indoor', multiplier: 1.0 },
    { key: 'outdoor', label: 'Outdoor', multiplier: 1.4 },
    { key: 'greenhouse', label: 'Greenhouse', multiplier: 1.2 },
  ];

  const clampNumber = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const calculateWatering = (): WateringResult => {
    const seasonLabels: Record<Season, string> = {
      spring: 'spring',
      summer: 'summer',
      fall: 'autumn',
      winter: 'winter',
    };

    const plantProfiles: Record<PlantType, {
      label: string;
      seasonalBaseline: Record<Season, number>;
      demandFactor: number;
      minInterval: number;
      maxInterval: number;
      drynessCue: string;
      careTips: string[];
    }> = {
      succulent: {
        label: 'succulents and cacti',
        seasonalBaseline: { spring: 12, summer: 7, fall: 16, winter: 21 },
        demandFactor: 0.35,
        minInterval: 5,
        maxInterval: 24,
        drynessCue: 'Let the top 5-7 cm of soil dry completely before watering again.',
        careTips: [
          'Use a gritty mix with plenty of perlite or pumice.',
          'Water early in the day so foliage dries quickly.',
        ],
      },
      tropical: {
        label: 'tropical foliage plants',
        seasonalBaseline: { spring: 5, summer: 3, fall: 6, winter: 8 },
        demandFactor: 1.1,
        minInterval: 2,
        maxInterval: 10,
        drynessCue: 'Keep the top 2-3 cm of soil evenly moist; water when it feels like a wrung-out sponge.',
        careTips: [
          'Pair watering with a balanced liquid feed every 4 weeks in active growth.',
          'Mist foliage or run a humidifier when humidity drops below 45%.',
        ],
      },
      flowering: {
        label: 'flowering houseplants',
        seasonalBaseline: { spring: 4, summer: 3, fall: 5, winter: 7 },
        demandFactor: 1.0,
        minInterval: 2,
        maxInterval: 9,
        drynessCue: 'Let the top 2 cm of soil dry slightly but never let buds wilt.',
        careTips: [
          'Avoid splashing blooms; water at the soil line only.',
          'Switch to a bloom fertiliser every second watering during peak season.',
        ],
      },
      foliage: {
        label: 'general foliage plants',
        seasonalBaseline: { spring: 7, summer: 5, fall: 8, winter: 10 },
        demandFactor: 0.9,
        minInterval: 3,
        maxInterval: 14,
        drynessCue: 'Water once the top 3-4 cm of soil feels dry and the pot is noticeably lighter.',
        careTips: [
          'Flush pots monthly to prevent fertiliser salt build-up.',
          'Rotate plants a quarter turn weekly for even growth.',
        ],
      },
      herb: {
        label: 'culinary herbs',
        seasonalBaseline: { spring: 3, summer: 2, fall: 4, winter: 6 },
        demandFactor: 0.85,
        minInterval: 2,
        maxInterval: 8,
        drynessCue: 'Keep media lightly moist; water when the top 2 cm is dry but before plants wilt.',
        careTips: [
          'Ensure six or more hours of bright light each day.',
          'Harvest regularly to encourage compact, hydrated growth.',
        ],
      },
      fern: {
        label: 'ferns',
        seasonalBaseline: { spring: 4, summer: 3, fall: 5, winter: 7 },
        demandFactor: 1.05,
        minInterval: 2,
        maxInterval: 10,
        drynessCue: 'Keep the root ball consistently moist; do not allow it to dry out completely.',
        careTips: [
          'Increase ambient humidity with trays of pebbles and water.',
          'Use room-temperature water to avoid shocking fronds.',
        ],
      },
    };

    const potVolumesLitres: Record<PotSize, number> = {
      small: 0.4,
      medium: 0.9,
      large: 1.6,
      xlarge: 2.5,
    };

    const potFrequencyMultiplier: Record<PotSize, number> = {
      small: 0.85,
      medium: 1,
      large: 1.12,
      xlarge: 1.2,
    };

    const soilFrequencyMultiplier: Record<SoilType, number> = {
      'well-draining': 0.95,
      'moisture-retaining': 1.25,
      sandy: 0.82,
      clay: 1.35,
    };

    const soilVolumeMultiplier: Record<SoilType, number> = {
      'well-draining': 1,
      'moisture-retaining': 0.85,
      sandy: 1.15,
      clay: 0.75,
    };

    const environmentFrequencyMultiplier: Record<Environment, number> = {
      indoor: 1,
      outdoor: 0.78,
      greenhouse: 0.88,
    };

    const environmentVolumeMultiplier: Record<Environment, number> = {
      indoor: 1,
      outdoor: 1.18,
      greenhouse: 1.08,
    };

    const potLabels: Record<PotSize, string> = {
      small: 'a small (4-6") pot',
      medium: 'a medium (6-10") pot',
      large: 'a large (10-14") pot',
      xlarge: 'an extra-large (14"+) container',
    };

    const profile = plantProfiles[plantType];
    const baseFrequency = profile.seasonalBaseline[season];

    const reasons: string[] = [
      `Baseline for ${profile.label} in ${seasonLabels[season]} is every ${baseFrequency} days.`,
    ];

    let frequency = baseFrequency;
    frequency *= potFrequencyMultiplier[potSize];
    if (potFrequencyMultiplier[potSize] !== 1) {
      reasons.push(`${potLabels[potSize]} alters the interval because soil volume changes how quickly it dries.`);
    }

    frequency *= soilFrequencyMultiplier[soilType];
    if (soilFrequencyMultiplier[soilType] !== 1) {
      reasons.push(`${soilType.replace('-', ' ')} soil affects drainage and moisture retention.`);
    }

    frequency *= environmentFrequencyMultiplier[environment];
    if (environmentFrequencyMultiplier[environment] !== 1) {
      const environmentLabel = environment === 'indoor' ? 'Indoor exposure' : environment === 'outdoor' ? 'Outdoor conditions' : 'Greenhouse conditions';
      reasons.push(`${environmentLabel} change evaporation rates and therefore watering cadence.`);
    }

    const tempValue = Number.parseFloat(temperature);
    if (Number.isFinite(tempValue)) {
      if (tempValue >= 29) {
        frequency *= 0.72;
        reasons.push('Temperatures above 29\u00B0C accelerate evaporation, shortening the interval.');
      } else if (tempValue >= 24) {
        frequency *= 0.85;
        reasons.push('Mid-20\u00B0C temperatures slightly increase water demand.');
      } else if (tempValue <= 15) {
        frequency *= 1.22;
        reasons.push('Cooler rooms slow plant metabolism, so you can wait a little longer between waterings.');
      }
    }

    const humidityValue = Number.parseFloat(humidity);
    if (Number.isFinite(humidityValue)) {
      if (humidityValue <= 35) {
        frequency *= 0.82;
        reasons.push('Low humidity dries soil faster, so water slightly more often.');
      } else if (humidityValue >= 65) {
        frequency *= 1.1;
        reasons.push('High humidity slows evaporation, extending the interval.');
      }
    }

    frequency = Math.round(clampNumber(frequency, profile.minInterval, profile.maxInterval));

    const baseVolumeMl = potVolumesLitres[potSize] * 1000 * profile.demandFactor;
    let amountMl = baseVolumeMl
      * soilVolumeMultiplier[soilType]
      * environmentVolumeMultiplier[environment];

    if (Number.isFinite(tempValue)) {
      if (tempValue >= 29) amountMl *= 1.1;
      if (tempValue <= 15) amountMl *= 0.9;
    }

    if (Number.isFinite(humidityValue)) {
      if (humidityValue <= 35) amountMl *= 1.08;
      else if (humidityValue >= 70) amountMl *= 0.92;
    }

    amountMl = clampNumber(amountMl, 120, 1600);
    const roundedAmountMl = Math.round(amountMl / 10) * 10;
    const cups = roundedAmountMl / 236.588;
    const cupText = cups >= 3 ? `${Math.round(cups)} cups` : `${cups.toFixed(cups >= 1 ? 1 : 2)} cups`;
    const amountText = `${roundedAmountMl} ml (${cupText})`;

    const nextWateringDate = new Date();
    nextWateringDate.setDate(nextWateringDate.getDate() + frequency);
    const schedule = `Next watering: ${nextWateringDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - every ${frequency} days`;

    const careTips = new Set<string>();
    careTips.add(profile.drynessCue);
    profile.careTips.forEach((tip) => careTips.add(tip));
    careTips.add('Check soil moisture down to your second knuckle before you water.');
    careTips.add('Empty saucers 15 minutes after watering to avoid root suffocation.');

    if (environment === 'outdoor') {
      careTips.add('Water during the coolest part of the day to reduce evaporation.');
      careTips.add('Skip planned waterings after significant rainfall.');
    }
    if (environment === 'greenhouse') {
      careTips.add('Ventilate after watering to avoid fungal pressure in enclosed spaces.');
    }
    if (soilType === 'sandy') {
      careTips.add('Blend in coco coir or compost to help sandy mixes hold moisture.');
    } else if (soilType === 'clay') {
      careTips.add('Loosen compact mixes with perlite to prevent waterlogging.');
    }
    if (plantType === 'herb') {
      careTips.add('Self-watering planters can stabilise moisture for thirsty herbs.');
    }
    if (Number.isFinite(humidityValue) && humidityValue <= 35) {
      careTips.add('Group plants or use pebble trays to boost relative humidity.');
    }

    return {
      frequency,
      amount: amountText,
      amountMl: roundedAmountMl,
      tips: Array.from(careTips),
      schedule,
      rationale: reasons,
    };
  };

  const handleCalculate = () => {
    const calculatedResult = calculateWatering();
    setResult(calculatedResult);
  };

  const handleSaveSchedule = () => {
    if (!result) return;
    
    Alert.alert(
      'Schedule Saved',
      `Your watering schedule has been saved! You'll water every ${result.frequency} days with ${result.amount}.`,
      [{ text: 'OK' }]
    );
  };

  const renderSelector = <T extends string>(
    title: string,
    options: { key: T; label: string; icon?: string }[],
    selected: T,
    onSelect: (value: T) => void
  ) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              selected === option.key && styles.selectedOption,
            ]}
            onPress={() => onSelect(option.key)}
          >
            {option.icon && <Text style={styles.optionIcon}>{option.icon}</Text>}
            <Text
              style={[
                styles.optionText,
                selected === option.key && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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
          <Droplets size={24} color="#22C55E" />
          <Text style={styles.headerTitle}>Water Calculator</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.description}>
            Get personalized watering recommendations based on your plant&apos;s specific needs and environment.
          </Text>

          {renderSelector('Plant Type', plantTypes, plantType, (value) => setPlantType(value as PlantType))}
          {renderSelector('Pot Size', potSizes, potSize, (value) => setPotSize(value as PotSize))}
          {renderSelector('Season', seasons, season, (value) => setSeason(value as Season))}
          {renderSelector('Soil Type', soilTypes, soilType, (value) => setSoilType(value as SoilType))}
          {renderSelector('Environment', environments, environment, (value) => setEnvironment(value as Environment))}

          {/* Environmental Factors */}
          <View style={styles.environmentalSection}>
            <Text style={styles.sectionTitle}>Environmental Conditions</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <Thermometer size={16} color="#6B7280" />
                  <Text style={styles.inputLabelText}>Temperature (\u00B0C)</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={temperature}
                  onChangeText={setTemperature}
                  keyboardType="numeric"
                  placeholder="22"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputLabel}>
                  <Wind size={16} color="#6B7280" />
                  <Text style={styles.inputLabelText}>Humidity (%)</Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={humidity}
                  onChangeText={setHumidity}
                  keyboardType="numeric"
                  placeholder="50"
                />
              </View>
            </View>
          </View>

          {/* Calculate Button */}
          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Calculator size={20} color="#FFFFFF" />
            <Text style={styles.calculateButtonText}>Calculate Watering Schedule</Text>
          </TouchableOpacity>

          {/* Results */}
          {result && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Your Watering Schedule</Text>
              
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Calendar size={20} color="#22C55E" />
                  <Text style={styles.resultSchedule}>{result.schedule}</Text>
                </View>
                
                <View style={styles.resultDetail}>
                  <Text style={styles.resultLabel}>Frequency:</Text>
                  <Text style={styles.resultValue}>Every {result.frequency} days</Text>
                </View>
                
                <View style={styles.resultDetail}>
                  <Text style={styles.resultLabel}>Amount:</Text>
                  <Text style={styles.resultValue}>{result.amount}</Text>
                </View>
              </View>

              {result.rationale.length > 0 && (
                <View style={styles.insightsContainer}>
                  <View style={styles.tipsHeader}>
                    <Info size={16} color="#166534" />
                    <Text style={[styles.tipsTitle, styles.insightsTitle]}>Why this schedule works</Text>
                  </View>
                  {result.rationale.map((reason, index) => (
                    <Text key={`reason-${index}`} style={styles.insightText}>
                      • {reason}
                    </Text>
                  ))}
                </View>
              )}

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <View style={styles.tipsHeader}>
                  <Info size={16} color="#3B82F6" />
                  <Text style={styles.tipsTitle}>Care Tips</Text>
                </View>
                {result.tips.map((tip, index) => (
                  <Text key={`tip-${index}-${tip.slice(0, 10)}`} style={styles.tipText}>
                    \u2022 {tip}
                  </Text>
                ))}
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveSchedule}>
                <Save size={16} color="#22C55E" />
                <Text style={styles.saveButtonText}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          )}
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
  selectorContainer: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '48%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  optionIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#22C55E',
    fontWeight: '500',
  },
  environmentalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  calculateButton: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultSchedule: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  resultDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  insightsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  insightsTitle: {
    color: '#166534',
  },
  insightText: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 6,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});
