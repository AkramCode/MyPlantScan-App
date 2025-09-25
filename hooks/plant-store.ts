import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { PlantIdentification, PlantHealth, UserPlant } from '@/types/plant';
import { Platform } from 'react-native';
import { openRouterService } from '@/lib/openrouter';

// Simple storage helper
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem(key);
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(key, value);
  }
};
import { mockIdentifications, mockUserPlants } from '@/mocks/plants';

const STORAGE_KEYS = {
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

const buildCareInstructionsFromObject = (
  value?: Record<string, unknown>,
): string => {
  if (!value) {
    return '';
  }
  const segments: string[] = [];
  const pairs: Array<[string, string]> = [
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

  const care =
    (isRecord(source['careDetails']) && (source['careDetails'] as Record<string, unknown>)) ||
    (isRecord(source['careInfo']) && (source['careInfo'] as Record<string, unknown>)) ||
    (isRecord(source['care']) && (source['care'] as Record<string, unknown>));

  const taxonomy =
    (isRecord(source['taxonomy']) && (source['taxonomy'] as Record<string, unknown>)) ||
    (isRecord(source['scientificClassification']) && (source['scientificClassification'] as Record<string, unknown>)) ||
    (isRecord(source['classification']) && (source['classification'] as Record<string, unknown>));

  const morphology =
    (isRecord(source['morphology']) && (source['morphology'] as Record<string, unknown>)) ||
    (isRecord(source['physicalCharacteristics']) && (source['physicalCharacteristics'] as Record<string, unknown>)) ||
    (isRecord(source['characteristics']) && (source['characteristics'] as Record<string, unknown>));

  const habitat =
    (isRecord(source['habitat']) && (source['habitat'] as Record<string, unknown>)) ||
    (isRecord(source['growingConditions']) && (source['growingConditions'] as Record<string, unknown>)) ||
    (isRecord(source['environment']) && (source['environment'] as Record<string, unknown>));

  const distribution =
    (isRecord(source['distribution']) && (source['distribution'] as Record<string, unknown>)) ||
    (isRecord(source['range']) && (source['range'] as Record<string, unknown>)) ||
    (isRecord(source['geography']) && (source['geography'] as Record<string, unknown>));

  const uses =
    (isRecord(source['uses']) && (source['uses'] as Record<string, unknown>)) ||
    (isRecord(source['applications']) && (source['applications'] as Record<string, unknown>));

  const conservation =
    (isRecord(source['conservationStatus']) && (source['conservationStatus'] as Record<string, unknown>)) ||
    (isRecord(source['conservation']) && (source['conservation'] as Record<string, unknown>));

  const seasonality =
    (isRecord(source['seasonality']) && (source['seasonality'] as Record<string, unknown>)) ||
    (isRecord(source['seasonalInformation']) && (source['seasonalInformation'] as Record<string, unknown>));

  const propagation =
    (isRecord(source['propagation']) && (source['propagation'] as Record<string, unknown>)) ||
    (isRecord(source['propagationInfo']) && (source['propagationInfo'] as Record<string, unknown>));

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

export const [PlantStoreProvider, usePlantStore] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);

  // Load identifications
  const identificationsQuery = useQuery({
    queryKey: ['plant_identifications'],
    queryFn: async (): Promise<PlantIdentification[]> => {
      try {
        const stored = await getStorageItem(STORAGE_KEYS.IDENTIFICATIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate that it's an array
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error parsing stored identifications:', error);
        // Clear corrupted data
        await setStorageItem(STORAGE_KEYS.IDENTIFICATIONS, JSON.stringify(mockIdentifications));
      }
      // Return mock data if no stored data exists or parsing failed
      await setStorageItem(STORAGE_KEYS.IDENTIFICATIONS, JSON.stringify(mockIdentifications));
      return mockIdentifications;
    },
  });

  // Load health records
  const healthRecordsQuery = useQuery({
    queryKey: ['plant_health_records'],
    queryFn: async (): Promise<PlantHealth[]> => {
      try {
        const stored = await getStorageItem(STORAGE_KEYS.HEALTH_RECORDS);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate that it's an array
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error parsing stored health records:', error);
        // Clear corrupted data
        await setStorageItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify([]));
      }
      return [];
    },
  });

  // Load user plants
  const userPlantsQuery = useQuery({
    queryKey: ['user_plants'],
    queryFn: async (): Promise<UserPlant[]> => {
      try {
        const stored = await getStorageItem(STORAGE_KEYS.USER_PLANTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate that it's an array
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error parsing stored user plants:', error);
        // Clear corrupted data
        await setStorageItem(STORAGE_KEYS.USER_PLANTS, JSON.stringify(mockUserPlants));
      }
      // Return mock data if no stored data exists or parsing failed
      await setStorageItem(STORAGE_KEYS.USER_PLANTS, JSON.stringify(mockUserPlants));
      return mockUserPlants;
    },
  });

  // Save identification mutation
  const saveIdentificationMutation = useMutation({
    mutationFn: async (identification: PlantIdentification) => {
      const current = identificationsQuery.data || [];
      const updated = [identification, ...current];
      await setStorageItem(STORAGE_KEYS.IDENTIFICATIONS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plant_identifications'] });
    },
  });

  // Save health record mutation
  const saveHealthRecordMutation = useMutation({
    mutationFn: async (healthRecord: PlantHealth) => {
      const current = healthRecordsQuery.data || [];
      const updated = [healthRecord, ...current];
      await setStorageItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plant_health_records'] });
    },
  });

  // Save user plant mutation
  const saveUserPlantMutation = useMutation({
    mutationFn: async (plant: UserPlant) => {
      const current = userPlantsQuery.data || [];
      const updated = [plant, ...current];
      await setStorageItem(STORAGE_KEYS.USER_PLANTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_plants'] });
    },
  });

  // Identify plant using AI
  const identifyPlant = useCallback(async (imageUri: string): Promise<PlantIdentification> => {
    if (!imageUri?.trim()) {
      throw new Error('Image URI is required');
    }
    console.log('Setting isIdentifying to true');
    setIsIdentifying(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });

      // Use OpenRouter for plant identification
      const aiResponseText = await openRouterService.identifyPlant(base64);

      // Parse the AI response to extract JSON
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

        console.log('Extracted JSON text:', jsonText);

        jsonText = jsonText
          .replace(/\u0000/g, '')
          .replace(/\r?\n/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .trim();

        const parsed = JSON.parse(jsonText);
        plantDetails = normalizePlantIdentification(parsed);
        console.log('Successfully parsed and normalized plant data:', plantDetails);
      } catch (parseError) {
        console.error('Failed to parse OpenRouter response:', parseError);
        console.error('Response that failed to parse:', aiResponseText);
        plantDetails = createDefaultPlantDetails();
      }

      const identification: PlantIdentification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUri,
        ...plantDetails,
      };

      await saveIdentificationMutation.mutateAsync(identification);
      return identification;
    } catch (error) {
      console.error('Error identifying plant:', error);
      throw error;
    } finally {
      console.log('Setting isIdentifying to false');
      setIsIdentifying(false);
    }
  }, [saveIdentificationMutation.mutateAsync]);

  // Analyze plant health
  const analyzeHealth = useCallback(async (imageUri: string, plantId?: string): Promise<PlantHealth> => {
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
          const result = reader.result as string;
          if (result) {
            resolve(result.split(',')[1]);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });

      console.log('Image converted to base64, making API request...');
      
      // Use OpenRouter for health analysis
      const aiResponseText = await openRouterService.analyzeHealth(base64);

      console.log('Raw OpenRouter health analysis response:', aiResponseText);
      
      let healthData;
      try {
        // Clean the response text and try to find JSON
        const cleanedText = aiResponseText.trim();
        
        // Multiple strategies to extract JSON
        let jsonText = '';
        
        // Strategy 1: Look for JSON code blocks
        const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i);
        if (jsonBlockMatch) {
          jsonText = jsonBlockMatch[1];
        } else {
          // Strategy 2: Look for the first { and last }
          const firstBrace = cleanedText.indexOf('{');
          const lastBrace = cleanedText.lastIndexOf('}');
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonText = cleanedText.substring(firstBrace, lastBrace + 1);
          } else {
            // Strategy 3: Try the entire response as JSON
            jsonText = cleanedText;
          }
        }
        
        console.log('Extracted health JSON text:', jsonText);
        
        if (!jsonText) {
          throw new Error('No JSON content found in response');
        }
        
        // Clean up common JSON formatting issues
        jsonText = jsonText
          .replace(/\n/g, ' ')  // Replace newlines with spaces
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .trim();
        
        // Parse the JSON
        healthData = JSON.parse(jsonText);
        
        // Validate and set defaults for required fields
        healthData.healthStatus = healthData.healthStatus || 'healthy';
        healthData.issues = Array.isArray(healthData.issues) ? healthData.issues : [];
        healthData.recommendations = Array.isArray(healthData.recommendations) ? healthData.recommendations : ['Continue regular care routine'];
        healthData.severity = healthData.severity || 'low';
        healthData.plantName = healthData.plantName || 'Unknown Plant';
        healthData.scientificName = healthData.scientificName || 'Species unknown';
        
        // Set defaults for complex nested objects
        healthData.diagnosis = healthData.diagnosis || {};
        healthData.diagnosis.primaryCondition = healthData.diagnosis.primaryCondition || 'Unable to determine condition';
        healthData.diagnosis.secondaryConditions = Array.isArray(healthData.diagnosis.secondaryConditions) ? healthData.diagnosis.secondaryConditions : [];
        healthData.diagnosis.affectedParts = Array.isArray(healthData.diagnosis.affectedParts) ? healthData.diagnosis.affectedParts : [];
        healthData.diagnosis.progressionStage = healthData.diagnosis.progressionStage || 'early';
        healthData.diagnosis.prognosis = healthData.diagnosis.prognosis || 'fair';
        
        healthData.symptoms = healthData.symptoms || {};
        healthData.symptoms.visual = Array.isArray(healthData.symptoms.visual) ? healthData.symptoms.visual : [];
        healthData.symptoms.physical = Array.isArray(healthData.symptoms.physical) ? healthData.symptoms.physical : [];
        healthData.symptoms.environmental = Array.isArray(healthData.symptoms.environmental) ? healthData.symptoms.environmental : [];
        
        healthData.treatment = healthData.treatment || {};
        healthData.treatment.immediate = Array.isArray(healthData.treatment.immediate) ? healthData.treatment.immediate : ['Take clearer photo for better analysis'];
        healthData.treatment.shortTerm = Array.isArray(healthData.treatment.shortTerm) ? healthData.treatment.shortTerm : ['Continue regular care'];
        healthData.treatment.longTerm = Array.isArray(healthData.treatment.longTerm) ? healthData.treatment.longTerm : ['Monitor plant health'];
        healthData.treatment.preventive = Array.isArray(healthData.treatment.preventive) ? healthData.treatment.preventive : ['Maintain good growing conditions'];
        
        healthData.causes = healthData.causes || {};
        healthData.causes.primary = healthData.causes.primary || 'Unable to determine';
        healthData.causes.contributing = Array.isArray(healthData.causes.contributing) ? healthData.causes.contributing : [];
        healthData.causes.environmental = Array.isArray(healthData.causes.environmental) ? healthData.causes.environmental : [];
        
        healthData.monitoring = healthData.monitoring || {};
        healthData.monitoring.checkFrequency = healthData.monitoring.checkFrequency || 'Weekly';
        healthData.monitoring.keyIndicators = Array.isArray(healthData.monitoring.keyIndicators) ? healthData.monitoring.keyIndicators : ['Overall plant appearance', 'Growth rate'];
        healthData.monitoring.recoveryTimeframe = healthData.monitoring.recoveryTimeframe || 'N/A';
        
        healthData.riskFactors = Array.isArray(healthData.riskFactors) ? healthData.riskFactors : [];
        
        console.log('Successfully parsed and validated health data:', healthData);
        
      } catch (parseError) {
        console.error('Failed to parse OpenRouter health analysis response:', parseError);
        console.error('Response that failed to parse:', aiResponseText);
        
        // Create fallback health data
        healthData = {
          healthStatus: "healthy" as const,
          issues: [],
          recommendations: ["Continue regular care routine"],
          severity: "low" as const,
          plantName: "Unknown Plant",
          scientificName: "Species unknown",
          diagnosis: {
            primaryCondition: "Unable to determine condition from image",
            secondaryConditions: [],
            affectedParts: [],
            progressionStage: "early" as const,
            prognosis: "fair" as const
          },
          symptoms: {
            visual: [],
            physical: [],
            environmental: []
          },
          treatment: {
            immediate: ["Take clearer photo for better analysis"],
            shortTerm: ["Continue regular care"],
            longTerm: ["Monitor plant health"],
            preventive: ["Maintain good growing conditions"]
          },
          causes: {
            primary: "Unable to determine",
            contributing: [],
            environmental: []
          },
          monitoring: {
            checkFrequency: "Weekly",
            keyIndicators: ["Overall plant appearance", "Growth rate"],
            recoveryTimeframe: "N/A"
          },
          riskFactors: []
        };
      }

      const healthRecord: PlantHealth = {
        id: Date.now().toString(),
        plantId: plantId || '',
        timestamp: Date.now(),
        imageUri,
        ...healthData,
      };

      console.log('Saving health record:', healthRecord);
      await saveHealthRecordMutation.mutateAsync(healthRecord);
      console.log('Health record saved successfully');
      return healthRecord;
    } catch (error) {
      console.error('Error analyzing plant health:', error);
      throw new Error('Failed to analyze plant health. Please try again.');
    } finally {
      setIsAnalyzingHealth(false);
    }
  }, [saveHealthRecordMutation.mutateAsync]);

  // Add plant to garden
  const addToGarden = useCallback(async (identification: PlantIdentification, location: string = '', notes: string = '') => {
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

    await saveUserPlantMutation.mutateAsync(userPlant);
    return userPlant;
  }, [saveUserPlantMutation.mutateAsync]);

  // Remove plant from garden mutation
  const removeFromGardenMutation = useMutation({
    mutationFn: async (plantId: string) => {
      const current = userPlantsQuery.data || [];
      const updated = current.filter(plant => plant.id !== plantId);
      await setStorageItem(STORAGE_KEYS.USER_PLANTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_plants'] });
    },
  });

  // Remove plant from garden
  const removeFromGarden = useCallback(async (plantId: string) => {
    await removeFromGardenMutation.mutateAsync(plantId);
  }, [removeFromGardenMutation.mutateAsync]);

  return useMemo(() => ({
    // Data
    identifications: identificationsQuery.data || [],
    healthRecords: healthRecordsQuery.data || [],
    userPlants: userPlantsQuery.data || [],
    
    // Loading states
    isLoading: identificationsQuery.isLoading || healthRecordsQuery.isLoading || userPlantsQuery.isLoading,
    isIdentifying,
    isAnalyzingHealth,
    
    // Actions
    identifyPlant,
    analyzeHealth,
    addToGarden,
    removeFromGarden,
  }), [
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
  ]);
});