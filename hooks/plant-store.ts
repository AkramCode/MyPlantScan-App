import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { PlantIdentification, PlantHealth, UserPlant } from '@/types/plant';
import { Platform } from 'react-native';
import { openRouterService } from '@/lib/openrouter';
import { ensureGuestToken } from '@/lib/guest-token';
import {
  fetchPlantIdentifications,
  savePlantIdentification,
  fetchPlantHealthRecords,
  savePlantHealthRecord,
  fetchGardenPlants,
  saveGardenPlant,
  deleteGardenPlant,
} from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
// Simple storage helper
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return await AsyncStorage.default.getItem(key);
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.setItem(key, value);
  }
};

const STORAGE_BASE_KEYS = {
  IDENTIFICATIONS: 'plant_identifications',
  HEALTH_RECORDS: 'plant_health_records',
  USER_PLANTS: 'user_plants',
};


const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNonEmptyString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return '';
};

const toStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (Array.isArray(value)) {
    const arr = value
      .map(toNonEmptyString)
      .filter(Boolean);
    if (arr.length) {
      return arr;
    }
    return [...fallback];
  }

  const str = toNonEmptyString(value);
  if (str) {
    const arr = str
      .split(/[,;\n]/)
      .map(part => part.trim())
      .filter(Boolean);
    if (arr.length) {
      return arr;
    }
  }
  return [...fallback];
};

const flattenToStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (Array.isArray(value)) {
    return toStringArray(value, fallback);
  }

  if (isRecord(value)) {
    const collected = Object.values(value)
      .map(toNonEmptyString)
      .filter(Boolean);
    if (collected.length) {
      return collected;
    }
  }

  return toStringArray(value, fallback);
};

const firstNonEmptyString = (candidates: unknown[], fallback: string): string => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const joined = candidate
        .map(toNonEmptyString)
        .filter(Boolean)
        .join(', ');
      if (joined) {
        return joined;
      }
    }
    const str = toNonEmptyString(candidate);
    if (str) {
      return str;
    }
  }
  return fallback;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toNormalizedKey = (value: unknown): string =>
  toNonEmptyString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const parseConfidenceScore = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = value > 1 ? value / 100 : value;
    return clamp(normalized, 0, 1);
  }

  const str = toNonEmptyString(value).replace('%', '');
  if (str) {
    const parsed = Number.parseFloat(str);
    if (Number.isFinite(parsed)) {
      const normalized = parsed > 1 ? parsed / 100 : parsed;
      return clamp(normalized, 0, 1);
    }
  }

  return clamp(fallback, 0, 1);
};

const interpretToxicity = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = toNonEmptyString(value).toLowerCase();
  if (!text) {
    return fallback;
  }
  if (/(non[-\s]?toxic|pet[-\s]?safe|safe for pets|non toxic|not toxic)/.test(text)) {
    return false;
  }
  if (/(toxic|poison|irritant|harmful)/.test(text)) {
    return true;
  }
  return fallback;
};

const interpretEdibility = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  const text = toNonEmptyString(value).toLowerCase();
  if (!text) {
    return fallback;
  }
  if (/(not edible|non[-\s]?edible|toxic|poison|unsafe)/.test(text)) {
    return false;
  }
  if (/(edible|consumable|culinary|safe to eat)/.test(text)) {
    return true;
  }
  return fallback;
};

const interpretPropagationDifficulty = (
  value: unknown,
  fallback: 'Easy' | 'Moderate' | 'Difficult',
): 'Easy' | 'Moderate' | 'Difficult' => {
  const text = toNonEmptyString(value).toLowerCase();
  if (!text) {
    return fallback;
  }
  if (/(easy|simple|straightforward|low)/.test(text)) {
    return 'Easy';
  }
  if (/(difficult|hard|challenging|advanced)/.test(text)) {
    return 'Difficult';
  }
  return 'Moderate';
};

const HEALTH_STATUS_VALUES: PlantHealth['healthStatus'][] = [
  'healthy',
  'diseased',
  'pest',
  'nutrient_deficiency',
  'overwatered',
  'underwatered',
];

const normalizeHealthStatus = (
  value: unknown,
  fallback: PlantHealth['healthStatus'],
): PlantHealth['healthStatus'] => {
  const key = toNormalizedKey(value);
  if (!key) {
    return fallback;
  }

  if (HEALTH_STATUS_VALUES.includes(key as PlantHealth['healthStatus'])) {
    return key as PlantHealth['healthStatus'];
  }

  if (key.includes('pest')) {
    return 'pest';
  }

  if (key.includes('diseas') || key.includes('infect') || key.includes('blight') || key.includes('rot')) {
    return 'diseased';
  }

  if (key.includes('nutrient') || key.includes('deficien')) {
    return 'nutrient_deficiency';
  }

  if (key.includes('overwater') || key.includes('waterlog') || key.includes('too_much_water')) {
    return 'overwatered';
  }

  if (key.includes('underwater') || key.includes('drought') || key.includes('too_little_water') || key.includes('dry')) {
    return 'underwatered';
  }

  if (key.includes('healthy') || key.includes('thriving') || key.includes('vigorous')) {
    return 'healthy';
  }

  return fallback;
};

const normalizeSeverity = (
  value: unknown,
  fallback: PlantHealth['severity'],
): PlantHealth['severity'] => {
  const key = toNormalizedKey(value);
  if (!key) {
    return fallback;
  }

  if (key.startsWith('low') || key.startsWith('mild') || key.includes('slight')) {
    return 'low';
  }

  if (key.startsWith('medium') || key.includes('moderate') || key === 'mid') {
    return 'medium';
  }

  if (key.startsWith('high') || key.includes('severe') || key.includes('critical')) {
    return 'high';
  }

  return fallback;
};

type ProgressionStage = PlantHealth['diagnosis']['progressionStage'];
type Prognosis = PlantHealth['diagnosis']['prognosis'];

const normalizeProgressionStage = (
  value: unknown,
  fallback: ProgressionStage,
): ProgressionStage => {
  const key = toNormalizedKey(value);
  if (!key) {
    return fallback;
  }

  if (key.includes('advanced') || key.includes('late') || key.includes('severe')) {
    return 'advanced';
  }

  if (key.includes('moderate') || key.includes('mid') || key.includes('middle')) {
    return 'moderate';
  }

  if (key.includes('early') || key.includes('initial') || key.includes('mild')) {
    return 'early';
  }

  return fallback;
};

const normalizePrognosis = (
  value: unknown,
  fallback: Prognosis,
): Prognosis => {
  const key = toNormalizedKey(value);
  if (!key) {
    return fallback;
  }

  if (key.includes('excellent') || key.includes('very_good') || key.includes('strong')) {
    return 'excellent';
  }

  if (key.includes('good') || key.includes('favourable') || key.includes('favorable')) {
    return 'good';
  }

  if (key.includes('fair') || key.includes('uncertain') || key.includes('guarded')) {
    return 'fair';
  }

  if (key.includes('poor') || key.includes('bad') || key.includes('critical')) {
    return 'poor';
  }

  return fallback;
};

const buildCareInstructionsFromObject = (
  value?: Record<string, unknown>,
): string => {
  if (!value) {
    return '';
  }
  const segments: string[] = [];
  const pairs: [string, string][] = [
    ['light', 'Light'],
    ['sunlight', 'Sunlight'],
    ['exposure', 'Exposure'],
    ['water', 'Water'],
    ['watering', 'Watering'],
    ['soil', 'Soil'],
    ['temperature', 'Temperature'],
    ['humidity', 'Humidity'],
    ['fertilizer', 'Fertilizer'],
    ['feeding', 'Feeding'],
    ['pruning', 'Pruning'],
  ];
  for (const [key, label] of pairs) {
    const str = toNonEmptyString(value[key]);
    if (str) {
      segments.push(`${label}: ${str}`);
    }
  }
  return segments.join('. ');
};

type PlantDetails = Omit<PlantIdentification, 'id' | 'timestamp' | 'imageUri'>;

const createDefaultPlantDetails = (): PlantDetails => ({
  plantName: 'Unknown Plant',
  scientificName: 'Species unknown',
  confidence: 0.5,
  description: 'Unable to identify this plant with confidence. Please try a clearer image.',
  careInstructions: 'General plant care: provide adequate light, water when soil is dry, and ensure good drainage.',
  commonNames: ['Unknown'],
  family: 'Unknown',
  isEdible: false,
  isToxic: false,
  lightRequirements: 'Medium',
  waterRequirements: 'Medium',
  soilType: 'Well-draining',
  bloomTime: 'Unknown',
  nativeRegion: 'Unknown',
  taxonomy: {
    kingdom: 'Plantae',
    phylum: 'Unknown',
    class: 'Unknown',
    order: 'Unknown',
    family: 'Unknown',
    genus: 'Unknown',
    species: 'Unknown',
  },
  morphology: {
    plantType: 'Unknown',
    height: 'Unknown',
    leafShape: 'Unknown',
    leafArrangement: 'Unknown',
    flowerColor: [],
    fruitType: 'Unknown',
    rootSystem: 'Unknown',
  },
  habitat: {
    climate: 'Unknown',
    soilPreference: 'Unknown',
    moistureRequirement: 'Unknown',
    temperatureRange: 'Unknown',
    hardiness: 'Unknown',
  },
  distribution: {
    nativeRegions: [],
    introducedRegions: [],
    altitudeRange: 'Unknown',
    commonHabitats: [],
  },
  uses: {
    medicinal: [],
    culinary: [],
    ornamental: [],
    industrial: [],
    ecological: [],
  },
  conservationStatus: {
    status: 'DD',
    statusDescription: 'Data Deficient',
    threats: [],
    protectionMeasures: [],
  },
  seasonality: {
    bloomingSeason: [],
    fruitingSeason: [],
    bestPlantingTime: [],
    dormancyPeriod: 'Unknown',
  },
  propagation: {
    methods: [],
    difficulty: 'Moderate',
    timeToMaturity: 'Unknown',
    specialRequirements: [],
  },
  companionPlants: [],
  pests: [],
  diseases: [],
  culturalSignificance: '',
  interestingFacts: [],
});

const normalizePlantIdentification = (raw: unknown): PlantDetails => {
  const defaults = createDefaultPlantDetails();
  const normalized = createDefaultPlantDetails();
  const source = isRecord(raw) ? raw : {};

  const care: Record<string, unknown> | undefined =
    (isRecord(source['careDetails']) && (source['careDetails'] as Record<string, unknown>)) ||
    (isRecord(source['careInfo']) && (source['careInfo'] as Record<string, unknown>)) ||
    (isRecord(source['care']) && (source['care'] as Record<string, unknown>)) ||
    undefined;

  const taxonomy: Record<string, unknown> | undefined =
    (isRecord(source['taxonomy']) && (source['taxonomy'] as Record<string, unknown>)) ||
    (isRecord(source['scientificClassification']) && (source['scientificClassification'] as Record<string, unknown>)) ||
    (isRecord(source['classification']) && (source['classification'] as Record<string, unknown>)) ||
    undefined;

  const morphology: Record<string, unknown> | undefined =
    (isRecord(source['morphology']) && (source['morphology'] as Record<string, unknown>)) ||
    (isRecord(source['physicalCharacteristics']) && (source['physicalCharacteristics'] as Record<string, unknown>)) ||
    (isRecord(source['characteristics']) && (source['characteristics'] as Record<string, unknown>)) ||
    undefined;

  const habitat: Record<string, unknown> | undefined =
    (isRecord(source['habitat']) && (source['habitat'] as Record<string, unknown>)) ||
    (isRecord(source['growingConditions']) && (source['growingConditions'] as Record<string, unknown>)) ||
    (isRecord(source['environment']) && (source['environment'] as Record<string, unknown>)) ||
    undefined;

  const distribution: Record<string, unknown> | undefined =
    (isRecord(source['distribution']) && (source['distribution'] as Record<string, unknown>)) ||
    (isRecord(source['range']) && (source['range'] as Record<string, unknown>)) ||
    (isRecord(source['geography']) && (source['geography'] as Record<string, unknown>)) ||
    undefined;

  const uses: Record<string, unknown> | undefined =
    (isRecord(source['uses']) && (source['uses'] as Record<string, unknown>)) ||
    (isRecord(source['applications']) && (source['applications'] as Record<string, unknown>)) ||
    undefined;

  const conservation: Record<string, unknown> | undefined =
    (isRecord(source['conservationStatus']) && (source['conservationStatus'] as Record<string, unknown>)) ||
    (isRecord(source['conservation']) && (source['conservation'] as Record<string, unknown>)) ||
    undefined;

  const seasonality: Record<string, unknown> | undefined =
    (isRecord(source['seasonality']) && (source['seasonality'] as Record<string, unknown>)) ||
    (isRecord(source['seasonalInformation']) && (source['seasonalInformation'] as Record<string, unknown>)) ||
    undefined;

  const propagation: Record<string, unknown> | undefined =
    (isRecord(source['propagation']) && (source['propagation'] as Record<string, unknown>)) ||
    (isRecord(source['propagationInfo']) && (source['propagationInfo'] as Record<string, unknown>)) ||
    undefined;

  normalized.plantName = firstNonEmptyString(
    [
      source['plantName'],
      source['commonName'],
      source['primaryCommonName'],
      Array.isArray(source['commonNames']) ? (source['commonNames'] as unknown[])[0] : undefined,
    ],
    defaults.plantName,
  );

  normalized.commonNames = toStringArray(
    source['commonNames'] ?? source['synonyms'] ?? source['aliases'] ?? source['commonName'],
    defaults.commonNames,
  );

  normalized.scientificName = firstNonEmptyString(
    [source['scientificName'], source['botanicalName'], source['binomialName']],
    defaults.scientificName,
  );

  normalized.confidence = parseConfidenceScore(
    source['confidence'] ?? source['confidenceScore'] ?? source['matchScore'] ?? source['matchPercentage'],
    defaults.confidence,
  );

  normalized.description = firstNonEmptyString(
    [source['description'], source['summary'], source['overview'], source['botanicalDescription']],
    defaults.description,
  );

  const careFromObject = buildCareInstructionsFromObject(care);
  normalized.careInstructions =
    firstNonEmptyString(
      [source['careInstructions'], source['careGuide'], source['careSummary'], source['careNotes']],
      '',
    ) || careFromObject || defaults.careInstructions;

  normalized.family = firstNonEmptyString(
    [
      source['family'],
      taxonomy?.['family'],
      taxonomy?.['familyName'],
    ],
    defaults.family,
  );

  normalized.isEdible = interpretEdibility(
    source['isEdible'] ?? source['edibility'] ?? source['edible'],
    defaults.isEdible,
  );
  normalized.isToxic = interpretToxicity(
    source['isToxic'] ?? source['toxicity'] ?? source['toxicToPets'] ?? source['toxicityLevel'],
    defaults.isToxic,
  );

  normalized.lightRequirements = firstNonEmptyString(
    [
      source['lightRequirements'],
      source['lightRequirement'],
      source['light'],
      care?.['light'],
      care?.['sunlight'],
    ],
    defaults.lightRequirements,
  );

  normalized.waterRequirements = firstNonEmptyString(
    [
      source['waterRequirements'],
      source['wateringFrequency'],
      source['water'],
      care?.['water'],
      care?.['watering'],
    ],
    defaults.waterRequirements,
  );

  normalized.soilType = firstNonEmptyString(
    [
      source['soilType'],
      source['soil'],
      care?.['soil'],
      habitat?.['soilType'],
      habitat?.['soilPreference'],
    ],
    defaults.soilType,
  );

  const bloomingSeasonArray = toStringArray(
    seasonality?.['bloomingSeason'] ??
      seasonality?.['bloomSeasons'] ??
      seasonality?.['floweringSeason'] ??
      source['bloomingSeason'],
    defaults.seasonality.bloomingSeason,
  );

  normalized.bloomTime = firstNonEmptyString(
    [source['bloomTime'], bloomingSeasonArray.join(', ')],
    defaults.bloomTime,
  );

  const bestPlantingArray = toStringArray(
    seasonality?.['bestPlantingTime'] ??
      seasonality?.['plantingSeason'] ??
      seasonality?.['plantingSeasons'],
    defaults.seasonality.bestPlantingTime,
  );

  const fruitingSeasonArray = toStringArray(
    seasonality?.['fruitingSeason'] ??
      seasonality?.['fruitingSeasons'] ??
      source['fruitingSeason'],
    defaults.seasonality.fruitingSeason,
  );

  normalized.seasonality = {
    bloomingSeason: bloomingSeasonArray,
    fruitingSeason: fruitingSeasonArray,
    bestPlantingTime: bestPlantingArray,
    dormancyPeriod: firstNonEmptyString(
      [seasonality?.['dormancyPeriod'], seasonality?.['dormancy'], source['dormancyPeriod']],
      defaults.seasonality.dormancyPeriod,
    ),
  };

  normalized.nativeRegion = firstNonEmptyString(
    [source['nativeRegion'], source['origin'], distribution?.['nativeRegion']],
    defaults.nativeRegion,
  );

  normalized.taxonomy = {
    ...defaults.taxonomy,
    kingdom: firstNonEmptyString(
      [taxonomy?.['kingdom'], source['kingdom']],
      defaults.taxonomy.kingdom,
    ),
    phylum: firstNonEmptyString(
      [taxonomy?.['phylum'], taxonomy?.['division'], source['phylum']],
      defaults.taxonomy.phylum,
    ),
    class: firstNonEmptyString(
      [taxonomy?.['class'], taxonomy?.['className'], source['class']],
      defaults.taxonomy.class,
    ),
    order: firstNonEmptyString(
      [taxonomy?.['order'], taxonomy?.['orderName'], source['order']],
      defaults.taxonomy.order,
    ),
    family: firstNonEmptyString(
      [taxonomy?.['family'], taxonomy?.['familyName'], source['family']],
      defaults.taxonomy.family,
    ),
    genus: firstNonEmptyString(
      [taxonomy?.['genus'], taxonomy?.['genusName'], source['genus']],
      defaults.taxonomy.genus,
    ),
    species: firstNonEmptyString(
      [taxonomy?.['species'], taxonomy?.['speciesName'], source['species']],
      defaults.taxonomy.species,
    ),
  };

  const scientificParts = normalized.scientificName.split(' ').filter(Boolean);
  if ((!normalized.taxonomy.genus || normalized.taxonomy.genus === defaults.taxonomy.genus) && scientificParts.length) {
    normalized.taxonomy.genus = scientificParts[0];
  }
  if ((!normalized.taxonomy.species || normalized.taxonomy.species === defaults.taxonomy.species) && scientificParts.length >= 2) {
    normalized.taxonomy.species = scientificParts.slice(1).join(' ');
  }
  if (!normalized.family || normalized.family === defaults.family) {
    normalized.family = normalized.taxonomy.family || defaults.family;
  }

  normalized.morphology = {
    plantType: firstNonEmptyString(
      [
        morphology?.['plantType'],
        morphology?.['growthForm'],
        source['plantType'],
        source['growthHabit'],
      ],
      defaults.morphology.plantType,
    ),
    height: firstNonEmptyString(
      [
        morphology?.['height'],
        morphology?.['size'],
        source['matureSize'],
        source['height'],
      ],
      defaults.morphology.height,
    ),
    leafShape: firstNonEmptyString(
      [morphology?.['leafShape'], source['leafShape'], morphology?.['leafShapes']],
      defaults.morphology.leafShape,
    ),
    leafArrangement: firstNonEmptyString(
      [morphology?.['leafArrangement'], source['leafArrangement']],
      defaults.morphology.leafArrangement,
    ),
    flowerColor: toStringArray(
      morphology?.['flowerColor'] ??
        morphology?.['flowerColors'] ??
        source['flowerColor'] ??
        source['flowerColors'],
      defaults.morphology.flowerColor,
    ),
    fruitType: firstNonEmptyString(
      [morphology?.['fruitType'], source['fruitType'], morphology?.['fruitTypes']],
      defaults.morphology.fruitType,
    ),
    rootSystem: firstNonEmptyString(
      [morphology?.['rootSystem'], source['rootSystem'], source['rootType']],
      defaults.morphology.rootSystem,
    ),
  };

  normalized.habitat = {
    climate: firstNonEmptyString(
      [habitat?.['climate'], source['climate']],
      defaults.habitat.climate,
    ),
    soilPreference: firstNonEmptyString(
      [
        habitat?.['soilPreference'],
        habitat?.['soilType'],
        source['soilPreference'],
        source['preferredSoil'],
      ],
      defaults.habitat.soilPreference,
    ),
    moistureRequirement: firstNonEmptyString(
      [
        habitat?.['moistureRequirement'],
        habitat?.['moisture'],
        source['moistureRequirement'],
        source['moistureNeeds'],
      ],
      defaults.habitat.moistureRequirement,
    ),
    temperatureRange: firstNonEmptyString(
      [
        habitat?.['temperatureRange'],
        habitat?.['temperature'],
        source['temperatureRange'],
        source['temperature'],
        care?.['temperature'],
      ],
      defaults.habitat.temperatureRange,
    ),
    hardiness: firstNonEmptyString(
      [
        habitat?.['hardiness'],
        source['hardiness'],
        source['hardinessZone'],
        source['hardinessZones'],
      ],
      defaults.habitat.hardiness,
    ),
  };

  normalized.distribution = {
    nativeRegions: toStringArray(
      distribution?.['nativeRegions'] ??
        distribution?.['nativeRegion'] ??
        source['nativeRegions'] ??
        source['nativeRegion'],
      defaults.distribution.nativeRegions,
    ),
    introducedRegions: toStringArray(
      distribution?.['introducedRegions'] ??
        distribution?.['introducedRegion'] ??
        source['introducedRegions'],
      defaults.distribution.introducedRegions,
    ),
    altitudeRange: firstNonEmptyString(
      [distribution?.['altitudeRange'], source['altitudeRange']],
      defaults.distribution.altitudeRange,
    ),
    commonHabitats: toStringArray(
      distribution?.['commonHabitats'] ??
        habitat?.['commonHabitats'] ??
        source['commonHabitats'],
      defaults.distribution.commonHabitats,
    ),
  };

  if ((!normalized.nativeRegion || normalized.nativeRegion === defaults.nativeRegion) && normalized.distribution.nativeRegions.length) {
    normalized.nativeRegion = normalized.distribution.nativeRegions.join(', ');
  }

  normalized.uses = {
    medicinal: toStringArray(uses?.['medicinal'] ?? source['medicinalUses'], defaults.uses.medicinal),
    culinary: toStringArray(uses?.['culinary'] ?? source['culinaryUses'], defaults.uses.culinary),
    ornamental: toStringArray(uses?.['ornamental'] ?? source['ornamentalUses'] ?? source['uses'], defaults.uses.ornamental),
    industrial: toStringArray(uses?.['industrial'] ?? source['industrialUses'], defaults.uses.industrial),
    ecological: toStringArray(uses?.['ecological'] ?? source['ecologicalUses'], defaults.uses.ecological),
  };

  const statusCode = firstNonEmptyString(
    [conservation?.['status'], conservation?.['code'], source['iucnStatus']],
    defaults.conservationStatus.status,
  )
    .toUpperCase()
    .replace(/[^A-Z]/g, '') as PlantIdentification['conservationStatus']['status'];

  const allowedStatuses: PlantIdentification['conservationStatus']['status'][] = ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE'];

  normalized.conservationStatus = {
    status: allowedStatuses.includes(statusCode) ? statusCode : defaults.conservationStatus.status,
    statusDescription: firstNonEmptyString(
      [conservation?.['statusDescription'], conservation?.['description'], conservation?.['summary']],
      defaults.conservationStatus.statusDescription,
    ),
    threats: toStringArray(conservation?.['threats'] ?? source['threats'], defaults.conservationStatus.threats),
    protectionMeasures: toStringArray(
      conservation?.['protectionMeasures'] ?? conservation?.['protections'] ?? source['protectionMeasures'],
      defaults.conservationStatus.protectionMeasures,
    ),
  };

  normalized.propagation = {
    methods: toStringArray(
      propagation?.['methods'] ?? propagation?.['techniques'] ?? source['propagationMethods'],
      defaults.propagation.methods,
    ),
    difficulty: interpretPropagationDifficulty(
      propagation?.['difficulty'] ?? source['propagationDifficulty'],
      defaults.propagation.difficulty,
    ),
    timeToMaturity: firstNonEmptyString(
      [propagation?.['timeToMaturity'], propagation?.['timeframe'], source['timeToMaturity']],
      defaults.propagation.timeToMaturity,
    ),
    specialRequirements: toStringArray(
      propagation?.['specialRequirements'] ?? propagation?.['requirements'] ?? source['propagationRequirements'],
      defaults.propagation.specialRequirements,
    ),
  };

  normalized.companionPlants = toStringArray(
    source['companionPlants'] ?? propagation?.['companionPlants'],
    defaults.companionPlants,
  );

  normalized.pests = toStringArray(
    source['pests'] ?? source['commonPests'] ?? uses?.['pests'],
    defaults.pests,
  );

  normalized.diseases = toStringArray(
    source['diseases'] ?? source['commonDiseases'] ?? uses?.['diseases'],
    defaults.diseases,
  );

  normalized.culturalSignificance = firstNonEmptyString(
    [source['culturalSignificance'], source['symbolism'], source['culturalNotes']],
    defaults.culturalSignificance,
  );

  normalized.interestingFacts = toStringArray(
    source['interestingFacts'] ?? source['facts'] ?? source['notableFeatures'],
    defaults.interestingFacts,
  );

  return normalized;
};

type HealthRecordDetails = Omit<PlantHealth, 'id' | 'plantId' | 'timestamp' | 'imageUri'>;

const createDefaultHealthDetails = (): HealthRecordDetails => ({
  plantName: 'Unknown Plant',
  scientificName: 'Species unknown',
  healthStatus: 'healthy',
  issues: [],
  recommendations: ['Continue regular care routine'],
  severity: 'low',
  diagnosis: {
    primaryCondition: 'Unable to determine condition from image',
    secondaryConditions: [],
    affectedParts: [],
    progressionStage: 'early',
    prognosis: 'fair',
  },
  symptoms: {
    visual: [],
    physical: [],
    environmental: [],
  },
  treatment: {
    immediate: ['Take clearer photo for better analysis'],
    shortTerm: ['Continue regular care'],
    longTerm: ['Monitor plant health'],
    preventive: ['Maintain good growing conditions'],
  },
  causes: {
    primary: 'Unable to determine',
    contributing: [],
    environmental: [],
  },
  monitoring: {
    checkFrequency: 'Weekly',
    keyIndicators: ['Overall plant appearance', 'Growth rate'],
    recoveryTimeframe: 'N/A',
  },
  riskFactors: [],
});

const normalizeHealthRecord = (
  raw: unknown,
  context?: { plantName?: string; scientificName?: string },
): HealthRecordDetails => {
  const defaults = createDefaultHealthDetails();
  const normalized: HealthRecordDetails = {
    ...defaults,
    issues: [...defaults.issues],
    recommendations: [...defaults.recommendations],
    diagnosis: {
      ...defaults.diagnosis,
      secondaryConditions: [...defaults.diagnosis.secondaryConditions],
      affectedParts: [...defaults.diagnosis.affectedParts],
    },
    symptoms: {
      visual: [...defaults.symptoms.visual],
      physical: [...defaults.symptoms.physical],
      environmental: [...defaults.symptoms.environmental],
    },
    treatment: {
      immediate: [...defaults.treatment.immediate],
      shortTerm: [...defaults.treatment.shortTerm],
      longTerm: [...defaults.treatment.longTerm],
      preventive: [...defaults.treatment.preventive],
    },
    causes: {
      ...defaults.causes,
      contributing: [...defaults.causes.contributing],
      environmental: [...defaults.causes.environmental],
    },
    monitoring: {
      ...defaults.monitoring,
      keyIndicators: [...defaults.monitoring.keyIndicators],
    },
    riskFactors: [...defaults.riskFactors],
  };

  const source = isRecord(raw) ? raw : {};
  const diagnosisSource = isRecord(source['diagnosis']) ? (source['diagnosis'] as Record<string, unknown>) : undefined;
  const symptomsSource = isRecord(source['symptoms']) ? (source['symptoms'] as Record<string, unknown>) : undefined;
  const treatmentSource = isRecord(source['treatment']) ? (source['treatment'] as Record<string, unknown>) : undefined;
  const causesSource = isRecord(source['causes']) ? (source['causes'] as Record<string, unknown>) : undefined;
  const monitoringSource = isRecord(source['monitoring']) ? (source['monitoring'] as Record<string, unknown>) : undefined;

  normalized.plantName = firstNonEmptyString(
    [
      source['plantName'],
      source['commonName'],
      diagnosisSource?.['plantName'],
      context?.plantName,
    ],
    defaults.plantName || 'Unknown Plant',
  );

  normalized.scientificName = firstNonEmptyString(
    [
      source['scientificName'],
      source['botanicalName'],
      diagnosisSource?.['scientificName'],
      context?.scientificName,
    ],
    defaults.scientificName || 'Species unknown',
  );

  normalized.healthStatus = normalizeHealthStatus(
    source['healthStatus'] ?? source['overallHealth'] ?? source['status'],
    defaults.healthStatus,
  );

  normalized.severity = normalizeSeverity(
    source['severity'] ?? diagnosisSource?.['severity'],
    defaults.severity,
  );

  normalized.issues = flattenToStringArray(
    source['issues'] ?? source['concerns'] ?? source['problems'],
    defaults.issues,
  );

  const recommendationsSource = source['recommendations'];
  if (Array.isArray(recommendationsSource) || isRecord(recommendationsSource)) {
    normalized.recommendations = flattenToStringArray(recommendationsSource, defaults.recommendations);
  } else {
    normalized.recommendations = flattenToStringArray(
      [recommendationsSource, source['care'], source['actions'], source['nextSteps']],
      defaults.recommendations,
    );
  }
  if (normalized.recommendations.length === 0) {
    normalized.recommendations = [...defaults.recommendations];
  }

  normalized.diagnosis.primaryCondition = firstNonEmptyString(
    [
      diagnosisSource?.['primaryCondition'],
      diagnosisSource?.['primary'],
      diagnosisSource?.['condition'],
      source['primaryCondition'],
    ],
    defaults.diagnosis.primaryCondition,
  );

  normalized.diagnosis.secondaryConditions = flattenToStringArray(
    diagnosisSource?.['secondaryConditions'] ?? source['secondaryConditions'],
    defaults.diagnosis.secondaryConditions,
  );

  normalized.diagnosis.affectedParts = flattenToStringArray(
    diagnosisSource?.['affectedParts'] ?? source['affectedParts'],
    defaults.diagnosis.affectedParts,
  );

  normalized.diagnosis.progressionStage = normalizeProgressionStage(
    diagnosisSource?.['progressionStage'] ?? source['progressionStage'],
    defaults.diagnosis.progressionStage,
  );

  normalized.diagnosis.prognosis = normalizePrognosis(
    diagnosisSource?.['prognosis'] ?? source['prognosis'],
    defaults.diagnosis.prognosis,
  );

  normalized.symptoms.visual = flattenToStringArray(
    symptomsSource?.['visual'] ?? symptomsSource?.['visible'] ?? source['visualSymptoms'],
    defaults.symptoms.visual,
  );

  normalized.symptoms.physical = flattenToStringArray(
    symptomsSource?.['physical'] ?? source['physicalSymptoms'],
    defaults.symptoms.physical,
  );

  normalized.symptoms.environmental = flattenToStringArray(
    symptomsSource?.['environmental'] ?? symptomsSource?.['environmentalFactors'] ?? source['environmentalSymptoms'] ?? source['environmental'],
    defaults.symptoms.environmental,
  );

  normalized.treatment.immediate = flattenToStringArray(
    treatmentSource?.['immediate'] ?? treatmentSource?.['urgent'] ?? source['immediateActions'],
    defaults.treatment.immediate,
  );

  normalized.treatment.shortTerm = flattenToStringArray(
    treatmentSource?.['shortTerm'] ?? treatmentSource?.['ongoing'] ?? source['shortTermRecommendations'],
    defaults.treatment.shortTerm,
  );

  normalized.treatment.longTerm = flattenToStringArray(
    treatmentSource?.['longTerm'] ?? treatmentSource?.['longterm'] ?? treatmentSource?.['longRange'] ?? source['longTermRecommendations'],
    defaults.treatment.longTerm,
  );

  normalized.treatment.preventive = flattenToStringArray(
    treatmentSource?.['preventive'] ?? treatmentSource?.['preventative'] ?? source['preventiveRecommendations'],
    defaults.treatment.preventive,
  );

  normalized.causes.primary = firstNonEmptyString(
    [
      causesSource?.['primary'],
      causesSource?.['rootCause'],
      source['primaryCause'],
      source['cause'],
    ],
    defaults.causes.primary,
  );

  normalized.causes.contributing = flattenToStringArray(
    causesSource?.['contributing'] ?? source['contributingFactors'],
    defaults.causes.contributing,
  );

  normalized.causes.environmental = flattenToStringArray(
    causesSource?.['environmental'] ?? source['environmentalFactors'],
    defaults.causes.environmental,
  );

  normalized.monitoring.checkFrequency = firstNonEmptyString(
    [
      monitoringSource?.['checkFrequency'],
      monitoringSource?.['frequency'],
      source['monitoringFrequency'],
    ],
    defaults.monitoring.checkFrequency,
  );

  normalized.monitoring.keyIndicators = flattenToStringArray(
    monitoringSource?.['keyIndicators'] ?? source['keyIndicators'],
    defaults.monitoring.keyIndicators,
  );

  normalized.monitoring.recoveryTimeframe = firstNonEmptyString(
    [
      monitoringSource?.['recoveryTimeframe'],
      monitoringSource?.['recoveryTimeline'],
      source['recoveryTimeframe'],
    ],
    defaults.monitoring.recoveryTimeframe,
  );

  normalized.riskFactors = flattenToStringArray(
    source['riskFactors'] ?? causesSource?.['riskFactors'],
    defaults.riskFactors,
  );

  if (context?.plantName && (!normalized.plantName || normalized.plantName === defaults.plantName)) {
    normalized.plantName = context.plantName;
  }

  if (context?.scientificName && (!normalized.scientificName || normalized.scientificName === defaults.scientificName)) {
    normalized.scientificName = context.scientificName;
  }

  return normalized;
};

export const [PlantStoreProvider, usePlantStore] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { session, user, loading: authLoading } = useAuth();
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guestTokenReady, setGuestTokenReady] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);

  useEffect(() => {
    let mounted = true;
    ensureGuestToken()
      .then((token) => {
        if (mounted) {
          setGuestToken(token);
        }
      })
      .catch((error) => {
        console.warn('PlantStore: Failed to initialize guest token', error);
      })
      .finally(() => {
        if (mounted) {
          setGuestTokenReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const storageNamespace = useMemo(() => {
    if (session?.access_token) {
      return user?.id ? `user:${user.id}` : 'user:pending';
    }
    if (guestToken) {
      return `guest:${guestToken}`;
    }
    return 'anonymous';
  }, [session?.access_token, user?.id, guestToken]);

  const storageKeys = useMemo(
    () => ({
      identifications: `${STORAGE_BASE_KEYS.IDENTIFICATIONS}:${storageNamespace}`,
      healthRecords: `${STORAGE_BASE_KEYS.HEALTH_RECORDS}:${storageNamespace}`,
      userPlants: `${STORAGE_BASE_KEYS.USER_PLANTS}:${storageNamespace}`,
    }),
    [storageNamespace]
  );

  const resolveScope = useCallback(async () => {
    if (session?.access_token) {
      return { accessToken: session.access_token };
    }
    if (guestToken) {
      return { guestToken };
    }
    const generated = await ensureGuestToken();
    setGuestToken(generated);
    return { guestToken: generated };
  }, [session?.access_token, guestToken]);

  const readCachedIdentifications = useCallback(async (): Promise<PlantIdentification[]> => {
    try {
      const stored = await getStorageItem(storageKeys.identifications);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as PlantIdentification[]) : [];
    } catch (error) {
      console.warn('PlantStore: Failed to parse cached identifications', error);
      return [];
    }
  }, [storageKeys.identifications]);

  const writeCachedIdentifications = useCallback(async (items: PlantIdentification[]) => {
    try {
      await setStorageItem(storageKeys.identifications, JSON.stringify(items));
    } catch (error) {
      console.warn('PlantStore: Failed to persist cached identifications', error);
    }
  }, [storageKeys.identifications]);

  const readCachedHealthRecords = useCallback(async (): Promise<PlantHealth[]> => {
    try {
      const stored = await getStorageItem(storageKeys.healthRecords);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as PlantHealth[]) : [];
    } catch (error) {
      console.warn('PlantStore: Failed to parse cached health records', error);
      return [];
    }
  }, [storageKeys.healthRecords]);

  const writeCachedHealthRecords = useCallback(async (items: PlantHealth[]) => {
    try {
      await setStorageItem(storageKeys.healthRecords, JSON.stringify(items));
    } catch (error) {
      console.warn('PlantStore: Failed to persist cached health records', error);
    }
  }, [storageKeys.healthRecords]);

  const readCachedUserPlants = useCallback(async (): Promise<UserPlant[]> => {
    try {
      const stored = await getStorageItem(storageKeys.userPlants);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as UserPlant[]) : [];
    } catch (error) {
      console.warn('PlantStore: Failed to parse cached garden plants', error);
      return [];
    }
  }, [storageKeys.userPlants]);

  const writeCachedUserPlants = useCallback(async (items: UserPlant[]) => {
    try {
      await setStorageItem(storageKeys.userPlants, JSON.stringify(items));
    } catch (error) {
      console.warn('PlantStore: Failed to persist cached garden plants', error);
    }
  }, [storageKeys.userPlants]);

  useEffect(() => {
    if (!storageNamespace) {
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['plant_identifications'] });
    queryClient.invalidateQueries({ queryKey: ['plant_health_records'] });
    queryClient.invalidateQueries({ queryKey: ['user_plants'] });
  }, [storageNamespace, queryClient]);

  const identificationsQuery = useQuery<PlantIdentification[]>({
    queryKey: ['plant_identifications', storageNamespace],
    enabled: !authLoading && (Boolean(session?.access_token) || guestTokenReady),
    initialData: [] as PlantIdentification[],
    queryFn: async () => {
      const fallback = await readCachedIdentifications();
      try {
        const scope = await resolveScope();
        const { data, error } = await fetchPlantIdentifications(scope);
        if (error) {
          throw new Error(error.message);
        }
        await writeCachedIdentifications(data);
        return data;
      } catch (error) {
        console.warn('PlantStore: fetchPlantIdentifications failed', error);
        return fallback;
      }
    },
  });

  const healthRecordsQuery = useQuery<PlantHealth[]>({
    queryKey: ['plant_health_records', storageNamespace],
    enabled: !authLoading && (Boolean(session?.access_token) || guestTokenReady),
    initialData: [] as PlantHealth[],
    queryFn: async () => {
      const fallback = await readCachedHealthRecords();
      try {
        const scope = await resolveScope();
        const { data, error } = await fetchPlantHealthRecords(scope);
        if (error) {
          throw new Error(error.message);
        }
        await writeCachedHealthRecords(data);
        return data;
      } catch (error) {
        console.warn('PlantStore: fetchPlantHealthRecords failed', error);
        return fallback;
      }
    },
  });

  const userPlantsQuery = useQuery<UserPlant[]>({
    queryKey: ['user_plants', storageNamespace],
    enabled: !authLoading && (Boolean(session?.access_token) || guestTokenReady),
    initialData: [] as UserPlant[],
    queryFn: async () => {
      const fallback = await readCachedUserPlants();
      try {
        const scope = await resolveScope();
        const { data, error } = await fetchGardenPlants(scope);
        if (error) {
          throw new Error(error.message);
        }
        await writeCachedUserPlants(data);
        return data;
      } catch (error) {
        console.warn('PlantStore: fetchGardenPlants failed', error);
        return fallback;
      }
    },
  });

  const saveIdentificationMutation = useMutation<PlantIdentification, Error, PlantIdentification>({
    mutationFn: async (identification) => {
      const scope = await resolveScope();
      const { data, error } = await savePlantIdentification({
        identification,
        accessToken: scope.accessToken,
        guestToken: scope.guestToken,
      });
      if (error || !data) {
        throw new Error(error?.message ?? 'Unable to save plant identification');
      }
      return data;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<PlantIdentification[]>(
        ['plant_identifications', storageNamespace],
        (current = []) => {
          const filtered = current.filter((item) => item.id !== saved.id);
          const next = [saved, ...filtered];
          void writeCachedIdentifications(next);
          return next;
        }
      );
    },
  });

  const saveHealthRecordMutation = useMutation<PlantHealth, Error, PlantHealth>({
    mutationFn: async (record) => {
      const scope = await resolveScope();
      const { data, error } = await savePlantHealthRecord({
        healthRecord: record,
        accessToken: scope.accessToken,
        guestToken: scope.guestToken,
      });
      if (error || !data) {
        throw new Error(error?.message ?? 'Unable to save plant health record');
      }
      return data;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<PlantHealth[]>(
        ['plant_health_records', storageNamespace],
        (current = []) => {
          const filtered = current.filter((item) => item.id !== saved.id);
          const next = [saved, ...filtered];
          void writeCachedHealthRecords(next);
          return next;
        }
      );
    },
  });

  const saveUserPlantMutation = useMutation<UserPlant, Error, UserPlant>({
    mutationFn: async (plant) => {
      const scope = await resolveScope();
      const { data, error } = await saveGardenPlant({
        plant,
        accessToken: scope.accessToken,
        guestToken: scope.guestToken,
      });
      if (error || !data) {
        throw new Error(error?.message ?? 'Unable to save garden plant');
      }
      return data;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<UserPlant[]>(
        ['user_plants', storageNamespace],
        (current = []) => {
          const filtered = current.filter((item) => item.id !== saved.id);
          const next = [saved, ...filtered];
          void writeCachedUserPlants(next);
          return next;
        }
      );
    },
  });

  const removeFromGardenMutation = useMutation<string, Error, string>({
    mutationFn: async (plantId) => {
      const scope = await resolveScope();
      const { data, error } = await deleteGardenPlant({
        plantId,
        accessToken: scope.accessToken,
        guestToken: scope.guestToken,
      });
      if (error) {
        throw new Error(error.message);
      }
      if (!data?.success) {
        throw new Error('Failed to remove garden plant');
      }
      return plantId;
    },
    onSuccess: (plantId) => {
      queryClient.setQueryData<UserPlant[]>(
        ['user_plants', storageNamespace],
        (current = []) => {
          const next = current.filter((item) => item.id !== plantId);
          void writeCachedUserPlants(next);
          return next;
        }
      );
    },
  });

  const identifyPlant = useCallback(
    async (imageUri: string): Promise<PlantIdentification> => {
      if (!imageUri?.trim()) {
        throw new Error('Image URI is required');
      }
      console.log('Setting isIdentifying to true');
      setIsIdentifying(true);
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string | null;
            if (!result) {
              reject(new Error('Failed to convert image to base64'));
              return;
            }
            resolve(result.split(',')[1] ?? '');
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(blob);
        });

        const aiResponseText = await openRouterService.identifyPlant(base64);

        let plantDetails: PlantDetails;
        try {
          console.log('Raw OpenRouter response:', aiResponseText);

          const cleanedText = aiResponseText.trim();
          let jsonText = '';

          const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
          if (jsonBlockMatch) {
            jsonText = jsonBlockMatch[1];
          } else {
            const firstBrace = cleanedText.indexOf('{');
            const lastBrace = cleanedText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              jsonText = cleanedText.substring(firstBrace, lastBrace + 1);
            } else {
              throw new Error('No valid JSON structure found in response');
            }
          }

          jsonText = jsonText.replace(new RegExp('\\r?\\n', 'g'), ' ');
          jsonText = jsonText.replace(new RegExp('\\s+', 'g'), ' ');
          jsonText = jsonText.replace(new RegExp(',\\s*}', 'g'), '}');
          jsonText = jsonText.replace(new RegExp(',\\s*]', 'g'), ']');
          jsonText = jsonText.trim();

          plantDetails = normalizePlantIdentification(JSON.parse(jsonText));
        } catch (parseError) {
          console.error('Failed to parse identification response:', parseError);
          plantDetails = normalizePlantIdentification({});
        }

        const dataUri = `data:${blob.type || 'image/jpeg'};base64,${base64}`;

        const identification: PlantIdentification = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          imageUri: dataUri,
          ...plantDetails,
        };

        const saved = await saveIdentificationMutation.mutateAsync(identification);
        return saved;
      } catch (error) {
        console.error('Error identifying plant:', error);
        throw error;
      } finally {
        console.log('Setting isIdentifying to false');
        setIsIdentifying(false);
      }
    },
    [saveIdentificationMutation]
  );

  const analyzeHealth = useCallback(
    async (imageUri: string, plantId?: string): Promise<PlantHealth> => {
      if (!imageUri?.trim()) {
        throw new Error('Image URI is required');
      }
      setIsAnalyzingHealth(true);
      try {
        console.log('Starting health analysis for image:', imageUri);

        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string | null;
            if (!result) {
              reject(new Error('Failed to convert image to base64'));
              return;
            }
            resolve(result.split(',')[1] ?? '');
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(blob);
        });

        console.log('Image converted to base64, making API request...');

        const identificationContext = plantId
          ? (identificationsQuery.data || []).find((item) => item.id === plantId)
          : undefined;

        const aiResponseText = await openRouterService.analyzeHealth({
          imageBase64: base64,
          plantName: identificationContext?.plantName,
          scientificName: identificationContext?.scientificName,
          maxTokens: 2600,
        });

        console.log('Raw OpenRouter health analysis response:', aiResponseText);

        let healthDetails: HealthRecordDetails;
        try {
          const cleanedText = aiResponseText.trim();
          let jsonText = '';

          const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
          if (jsonBlockMatch) {
            jsonText = jsonBlockMatch[1];
          } else {
            const firstBrace = cleanedText.indexOf('{');
            const lastBrace = cleanedText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              jsonText = cleanedText.substring(firstBrace, lastBrace + 1);
            } else {
              jsonText = cleanedText;
            }
          }

          console.log('Extracted health JSON text:', jsonText);

          if (!jsonText) {
            throw new Error('No JSON content found in response');
          }

          jsonText = jsonText.replace(new RegExp('\\r?\\n', 'g'), ' ');
          jsonText = jsonText.replace(new RegExp('\\s+', 'g'), ' ');
          jsonText = jsonText.replace(new RegExp(',\\s*}', 'g'), '}');
          jsonText = jsonText.replace(new RegExp(',\\s*]', 'g'), ']');
          jsonText = jsonText.trim();

          const parsed = JSON.parse(jsonText);
          healthDetails = normalizeHealthRecord(parsed, {
            plantName: identificationContext?.plantName,
            scientificName: identificationContext?.scientificName,
          });
          console.log('Successfully parsed and normalized health data:', healthDetails);
        } catch (parseError) {
          console.error('Failed to parse OpenRouter health analysis response:', parseError);
          console.error('Response that failed to parse:', aiResponseText);

          healthDetails = normalizeHealthRecord({}, {
            plantName: identificationContext?.plantName,
            scientificName: identificationContext?.scientificName,
          });
        }

        const dataUri = `data:${blob.type || 'image/jpeg'};base64,${base64}`;

        const healthRecord: PlantHealth = {
          id: Date.now().toString(),
          plantId: plantId || '',
          timestamp: Date.now(),
          imageUri: dataUri,
          ...healthDetails,
        };

        console.log('Saving health record:', healthRecord);
        const saved = await saveHealthRecordMutation.mutateAsync(healthRecord);
        console.log('Health record saved successfully');
        return saved;
      } catch (error) {
        console.error('Error analyzing plant health:', error);
        throw new Error('Failed to analyze plant health. Please try again.');
      } finally {
        setIsAnalyzingHealth(false);
      }
    },
    [saveHealthRecordMutation, identificationsQuery.data]
  );

  const addToGarden = useCallback(
    async (identification: PlantIdentification, location: string = '', notes: string = '') => {
      const userPlant: UserPlant = {
        id: Date.now().toString(),
        plantName: identification.plantName,
        scientificName: identification.scientificName,
        imageUri: identification.imageUri,
        dateAdded: Date.now(),
        notes,
        location,
        identificationId: identification.id,
      };

      const saved = await saveUserPlantMutation.mutateAsync(userPlant);
      return saved;
    },
    [saveUserPlantMutation]
  );

  const removeFromGarden = useCallback(
    async (plantId: string) => {
      await removeFromGardenMutation.mutateAsync(plantId);
    },
    [removeFromGardenMutation]
  );

  return useMemo(
    () => ({
      identifications: identificationsQuery.data ?? ([] as PlantIdentification[]),
      healthRecords: healthRecordsQuery.data ?? ([] as PlantHealth[]),
      userPlants: userPlantsQuery.data ?? ([] as UserPlant[]),

      isLoading:
        identificationsQuery.isLoading ||
        healthRecordsQuery.isLoading ||
        userPlantsQuery.isLoading,
      isIdentifying,
      isAnalyzingHealth,

      identifyPlant,
      analyzeHealth,
      addToGarden,
      removeFromGarden,
    }),
    [
      identificationsQuery.data,
      healthRecordsQuery.data,
      userPlantsQuery.data,
      identificationsQuery.isLoading,
      healthRecordsQuery.isLoading,
      userPlantsQuery.isLoading,
      isIdentifying,
      isAnalyzingHealth,
      identifyPlant,
      analyzeHealth,
      addToGarden,
      removeFromGarden,
    ]
  );
});




