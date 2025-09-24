export interface PlantIdentification {
  id: string;
  timestamp: number;
  imageUri: string;
  plantName: string;
  scientificName: string;
  confidence: number;
  description: string;
  careInstructions: string;
  commonNames: string[];
  family: string;
  isEdible: boolean;
  isToxic: boolean;
  lightRequirements: string;
  waterRequirements: string;
  soilType: string;
  bloomTime: string;
  nativeRegion: string;
  // Enhanced botanical information
  taxonomy: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
  morphology: {
    plantType: string; // tree, shrub, herb, vine, etc.
    height: string;
    leafShape: string;
    leafArrangement: string;
    flowerColor: string[];
    fruitType: string;
    rootSystem: string;
  };
  habitat: {
    climate: string;
    soilPreference: string;
    moistureRequirement: string;
    temperatureRange: string;
    hardiness: string;
  };
  distribution: {
    nativeRegions: string[];
    introducedRegions: string[];
    altitudeRange: string;
    commonHabitats: string[];
  };
  uses: {
    medicinal: string[];
    culinary: string[];
    ornamental: string[];
    industrial: string[];
    ecological: string[];
  };
  conservationStatus: {
    status: 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX' | 'DD' | 'NE'; // IUCN Red List categories
    statusDescription: string;
    threats: string[];
    protectionMeasures: string[];
  };
  seasonality: {
    bloomingSeason: string[];
    fruitingSeason: string[];
    bestPlantingTime: string[];
    dormancyPeriod: string;
  };
  propagation: {
    methods: string[];
    difficulty: 'Easy' | 'Moderate' | 'Difficult';
    timeToMaturity: string;
    specialRequirements: string[];
  };
  companionPlants: string[];
  pests: string[];
  diseases: string[];
  culturalSignificance: string;
  interestingFacts: string[];
}

export interface PlantHealth {
  id: string;
  plantId: string;
  timestamp: number;
  imageUri: string;
  healthStatus: 'healthy' | 'diseased' | 'pest' | 'nutrient_deficiency' | 'overwatered' | 'underwatered';
  issues: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
  // Enhanced diagnostic information
  diagnosis: {
    primaryCondition: string;
    secondaryConditions: string[];
    affectedParts: string[];
    progressionStage: 'early' | 'moderate' | 'advanced';
    prognosis: 'excellent' | 'good' | 'fair' | 'poor';
  };
  symptoms: {
    visual: string[];
    physical: string[];
    environmental: string[];
  };
  treatment: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    preventive: string[];
  };
  causes: {
    primary: string;
    contributing: string[];
    environmental: string[];
  };
  monitoring: {
    checkFrequency: string;
    keyIndicators: string[];
    recoveryTimeframe: string;
  };
  riskFactors: string[];
  plantName?: string;
  scientificName?: string;
}

export interface UserPlant {
  id: string;
  plantName: string;
  scientificName: string;
  imageUri: string;
  dateAdded: number;
  lastWatered?: number;
  lastFertilized?: number;
  notes: string;
  location: string;
  identificationId: string;
}