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
      let plantData;
      try {
        console.log('Raw OpenRouter response:', aiResponseText);
        
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
            throw new Error('No valid JSON structure found in response');
          }
        }
        
        console.log('Extracted JSON text:', jsonText);
        
        // Clean up common JSON formatting issues
        jsonText = jsonText
          .replace(/\n/g, ' ')  // Replace newlines with spaces
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .trim();
        
        // Parse the JSON
        plantData = JSON.parse(jsonText);
        
        // Validate and set defaults for required fields
        plantData.plantName = plantData.plantName || 'Unknown Plant';
        plantData.scientificName = plantData.scientificName || 'Species unknown';
        plantData.confidence = typeof plantData.confidence === 'number' ? plantData.confidence : 0.5;
        plantData.description = plantData.description || 'Unable to identify this plant with confidence.';
        plantData.careInstructions = plantData.careInstructions || 'General plant care: provide adequate light, water when soil is dry.';
        plantData.commonNames = Array.isArray(plantData.commonNames) ? plantData.commonNames : ['Unknown'];
        plantData.family = plantData.family || 'Unknown';
        plantData.isEdible = typeof plantData.isEdible === 'boolean' ? plantData.isEdible : false;
        plantData.isToxic = typeof plantData.isToxic === 'boolean' ? plantData.isToxic : false;
        plantData.lightRequirements = plantData.lightRequirements || 'Medium';
        plantData.waterRequirements = plantData.waterRequirements || 'Medium';
        plantData.soilType = plantData.soilType || 'Well-draining';
        plantData.bloomTime = plantData.bloomTime || 'Unknown';
        plantData.nativeRegion = plantData.nativeRegion || 'Unknown';
        
        // Set defaults for enhanced fields
        plantData.taxonomy = plantData.taxonomy || {
          kingdom: 'Plantae',
          phylum: 'Unknown',
          class: 'Unknown',
          order: 'Unknown',
          family: plantData.family || 'Unknown',
          genus: 'Unknown',
          species: 'Unknown'
        };
        
        plantData.morphology = plantData.morphology || {
          plantType: 'Unknown',
          height: 'Unknown',
          leafShape: 'Unknown',
          leafArrangement: 'Unknown',
          flowerColor: [],
          fruitType: 'Unknown',
          rootSystem: 'Unknown'
        };
        
        plantData.habitat = plantData.habitat || {
          climate: 'Unknown',
          soilPreference: 'Unknown',
          moistureRequirement: 'Unknown',
          temperatureRange: 'Unknown',
          hardiness: 'Unknown'
        };
        
        plantData.distribution = plantData.distribution || {
          nativeRegions: [],
          introducedRegions: [],
          altitudeRange: 'Unknown',
          commonHabitats: []
        };
        
        plantData.uses = plantData.uses || {
          medicinal: [],
          culinary: [],
          ornamental: [],
          industrial: [],
          ecological: []
        };
        
        plantData.conservationStatus = plantData.conservationStatus || {
          status: 'DD',
          statusDescription: 'Data Deficient',
          threats: [],
          protectionMeasures: []
        };
        
        plantData.seasonality = plantData.seasonality || {
          bloomingSeason: [],
          fruitingSeason: [],
          bestPlantingTime: [],
          dormancyPeriod: 'Unknown'
        };
        
        plantData.propagation = plantData.propagation || {
          methods: [],
          difficulty: 'Moderate',
          timeToMaturity: 'Unknown',
          specialRequirements: []
        };
        
        plantData.companionPlants = plantData.companionPlants || [];
        plantData.pests = plantData.pests || [];
        plantData.diseases = plantData.diseases || [];
        plantData.culturalSignificance = plantData.culturalSignificance || '';
        plantData.interestingFacts = plantData.interestingFacts || [];
        
        console.log('Successfully parsed and validated plant data:', plantData);
        
      } catch (parseError) {
        console.error('Failed to parse OpenRouter response:', parseError);
        console.error('Response that failed to parse:', aiResponseText);
        
        // Fallback if JSON parsing fails - complete structure
        plantData = {
          plantName: "Unknown Plant",
          scientificName: "Species unknown",
          confidence: 0.5,
          description: "Unable to identify this plant with confidence. Please try a clearer image.",
          careInstructions: "General plant care: provide adequate light, water when soil is dry, and ensure good drainage.",
          commonNames: ["Unknown"],
          family: "Unknown",
          isEdible: false,
          isToxic: false,
          lightRequirements: "Medium",
          waterRequirements: "Medium",
          soilType: "Well-draining",
          bloomTime: "Unknown",
          nativeRegion: "Unknown",
          taxonomy: {
            kingdom: 'Plantae',
            phylum: 'Unknown',
            class: 'Unknown',
            order: 'Unknown',
            family: 'Unknown',
            genus: 'Unknown',
            species: 'Unknown'
          },
          morphology: {
            plantType: 'Unknown',
            height: 'Unknown',
            leafShape: 'Unknown',
            leafArrangement: 'Unknown',
            flowerColor: [],
            fruitType: 'Unknown',
            rootSystem: 'Unknown'
          },
          habitat: {
            climate: 'Unknown',
            soilPreference: 'Unknown',
            moistureRequirement: 'Unknown',
            temperatureRange: 'Unknown',
            hardiness: 'Unknown'
          },
          distribution: {
            nativeRegions: [],
            introducedRegions: [],
            altitudeRange: 'Unknown',
            commonHabitats: []
          },
          uses: {
            medicinal: [],
            culinary: [],
            ornamental: [],
            industrial: [],
            ecological: []
          },
          conservationStatus: {
            status: 'DD' as const,
            statusDescription: 'Data Deficient',
            threats: [],
            protectionMeasures: []
          },
          seasonality: {
            bloomingSeason: [],
            fruitingSeason: [],
            bestPlantingTime: [],
            dormancyPeriod: 'Unknown'
          },
          propagation: {
            methods: [],
            difficulty: 'Moderate' as const,
            timeToMaturity: 'Unknown',
            specialRequirements: []
          },
          companionPlants: [],
          pests: [],
          diseases: [],
          culturalSignificance: '',
          interestingFacts: []
        };
      }

      const identification: PlantIdentification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUri,
        ...plantData,
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