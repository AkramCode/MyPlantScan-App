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
  frequency: number; // days between watering
  amount: string;
  tips: string[];
  schedule: string;
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
    { key: 'succulent', label: 'Succulent/Cactus', icon: '🌵' },
    { key: 'tropical', label: 'Tropical Plants', icon: '🌴' },
    { key: 'flowering', label: 'Flowering Plants', icon: '🌸' },
    { key: 'foliage', label: 'Foliage Plants', icon: '🌿' },
    { key: 'herb', label: 'Herbs', icon: '🌱' },
    { key: 'fern', label: 'Ferns', icon: '🌿' },
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

  const calculateWatering = (): WateringResult => {
    // Base watering frequencies (days) for different plant types
    const baseFrequencies: Record<PlantType, number> = {
      succulent: 14,
      tropical: 5,
      flowering: 4,
      foliage: 7,
      herb: 3,
      fern: 4,
    };

    let frequency = baseFrequencies[plantType];
    
    // Apply multipliers
    const potMultiplier = potSizes.find(p => p.key === potSize)?.multiplier || 1;
    const seasonMultiplier = seasons.find(s => s.key === season)?.multiplier || 1;
    const soilMultiplier = soilTypes.find(s => s.key === soilType)?.multiplier || 1;
    const envMultiplier = environments.find(e => e.key === environment)?.multiplier || 1;
    
    // Temperature and humidity adjustments
    const temp = parseFloat(temperature) || 22;
    const humid = parseFloat(humidity) || 50;
    
    let tempMultiplier = 1;
    if (temp > 25) tempMultiplier = 1.2;
    else if (temp < 18) tempMultiplier = 0.8;
    
    let humidityMultiplier = 1;
    if (humid < 40) humidityMultiplier = 1.2;
    else if (humid > 60) humidityMultiplier = 0.9;
    
    // Calculate final frequency
    frequency = frequency / (seasonMultiplier * tempMultiplier * humidityMultiplier * envMultiplier);
    frequency = frequency * soilMultiplier * (1 / potMultiplier);
    
    // Round to reasonable values
    frequency = Math.max(1, Math.round(frequency));
    
    // Generate amount recommendation
    let amount = 'Water until it drains from bottom';
    if (potSize === 'small') amount = '1/4 to 1/2 cup';
    else if (potSize === 'medium') amount = '1/2 to 1 cup';
    else if (potSize === 'large') amount = '1 to 2 cups';
    else amount = '2+ cups';
    
    // Generate tips
    const tips = [];
    
    if (plantType === 'succulent') {
      tips.push('Allow soil to dry completely between waterings');
      tips.push('Water deeply but infrequently');
    } else if (plantType === 'tropical') {
      tips.push('Keep soil consistently moist but not soggy');
      tips.push('Increase humidity around the plant');
    } else if (plantType === 'fern') {
      tips.push('Keep soil evenly moist');
      tips.push('Mist regularly to increase humidity');
    }
    
    if (season === 'winter') {
      tips.push('Reduce watering frequency in winter months');
    } else if (season === 'summer') {
      tips.push('Check soil more frequently in hot weather');
    }
    
    if (environment === 'outdoor') {
      tips.push('Check weather forecast before watering');
      tips.push('Water early morning or late evening');
    }
    
    tips.push('Always check soil moisture before watering');
    tips.push('Ensure proper drainage to prevent root rot');
    
    // Generate schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    const nextWateringDay = (today + frequency) % 7;
    const schedule = `Next watering: ${days[nextWateringDay]} (every ${frequency} days)`;
    
    return {
      frequency,
      amount,
      tips,
      schedule,
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
      `Your watering schedule has been saved! You&apos;ll water every ${result.frequency} days with ${result.amount}.`,
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
            Get personalized watering recommendations based on your plant's specific needs and environment.
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
                  <Text style={styles.inputLabelText}>Temperature (°C)</Text>
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

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <View style={styles.tipsHeader}>
                  <Info size={16} color="#3B82F6" />
                  <Text style={styles.tipsTitle}>Care Tips</Text>
                </View>
                {result.tips.map((tip, index) => (
                  <Text key={`tip-${index}-${tip.slice(0, 10)}`} style={styles.tipText}>
                    • {tip}
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