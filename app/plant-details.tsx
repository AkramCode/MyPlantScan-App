import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Share as RNShare, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { 
  Leaf, 
  Sun, 
  Droplets, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Calendar,
  Heart,
  ArrowLeft,
  Share,
  MapPin,
  Thermometer,
  Scissors,
  Shield,
  Bug,
  Zap,
  Award,
  Globe,
  TreePine,
  Flower,
  Clock,
  Target
} from 'lucide-react-native';
import { usePlantStore } from '@/hooks/plant-store';
import type { PlantIdentification, UserPlant } from '@/types/plant';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScanningOverlay from '@/components/ScanningOverlay';
import HealthCheckModal from '@/components/HealthCheckModal';
import { Colors, getConfidenceColor } from '@/constants/colors';

export default function PlantDetailsScreen() {
  const { id, source } = useLocalSearchParams<{ id?: string | string[]; source?: string }>();
  const { identifications, addToGarden, userPlants, isAnalyzingHealth, analyzeHealth } = usePlantStore();
  const [isAddingToGarden, setIsAddingToGarden] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const insets = useSafeAreaInsets();

  const normalizedId = Array.isArray(id) ? id[0] : id;
  const identification = normalizedId
    ? identifications.find((plant: PlantIdentification) => plant.id === normalizedId)
    : undefined;
  const isInGarden = normalizedId
    ? userPlants.some((plant: UserPlant) => plant.identificationId === normalizedId)
    : false;

  const handleBackPress = () => {
    if (source === 'camera') {
      router.push('/');
    } else if (source === 'garden') {
      router.push('/garden');
    } else {
      // Default to home for 'home' source or any other case
      router.push('/');
    }
  };

  const showAlert = (title: string, message: string) => {
    if (!title?.trim() || !message?.trim()) return;
    if (title.length > 100 || message.length > 500) return;
    
    if (Platform.OS !== 'web') {
      Alert.alert(title.trim(), message.trim());
    }
  };

  const handleShare = async () => {
    if (!identification) return;
    
    try {
      const shareContent = {
        message: `Check out this plant I identified: ${identification.plantName} (${identification.scientificName})\n\nDescription: ${identification.description}\n\nCare Instructions: ${identification.careInstructions}`,
        title: `Plant Identification: ${identification.plantName}`,
      };
      
      if (Platform.OS !== 'web') {
        await RNShare.share(shareContent);
      } else {
        // Web fallback - copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareContent.message);
          console.log('Plant details copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!identification) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Plant not found</Text>
      </View>
    );
  }

  const handleAddToGarden = async () => {
    if (isInGarden) return;
    
    setIsAddingToGarden(true);
    try {
      await addToGarden(identification, 'Indoor', '');
      showAlert('Success', 'Plant added to your garden!');
    } catch {
      showAlert('Error', 'Failed to add plant to garden');
    } finally {
      setIsAddingToGarden(false);
    }
  };



  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Image with Back Button */}
          <View style={styles.heroContainer}>
            <Image source={{ uri: identification.imageUri }} style={styles.heroImage} />
            <TouchableOpacity 
              style={[styles.backButton, { top: insets.top + 16 }]} 
              onPress={handleBackPress}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.shareButton, { top: insets.top + 16 }]} 
              onPress={handleShare}
            >
              <Share size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        
        {/* Main Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.plantName}>{identification.plantName}</Text>
              <Text style={styles.scientificName}>{identification.scientificName}</Text>
            </View>
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(identification.confidence) }]}>
              <Text style={styles.confidenceText}>
                {Math.round(identification.confidence * 100)}% match
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.addToGardenButton, 
                isInGarden && styles.addToGardenButtonDisabled,
                isAddingToGarden && styles.addToGardenButtonDisabled
              ]}
              onPress={handleAddToGarden}
              disabled={isInGarden || isAddingToGarden}
            >
              {isInGarden ? (
                <>
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.addToGardenButtonText}>In Garden</Text>
                </>
              ) : (
                <>
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addToGardenButtonText}>
                    {isAddingToGarden ? 'Adding...' : 'Add to Garden'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.healthCheckButton,
                isAnalyzingHealth && styles.healthCheckButtonDisabled
              ]}
              onPress={() => setShowHealthModal(true)}
              disabled={isAnalyzingHealth}
            >
              <Heart size={18} color={isAnalyzingHealth ? Colors.gray400 : Colors.primary} />
              <Text style={[
                styles.healthCheckButtonText,
                isAnalyzingHealth && styles.healthCheckButtonTextDisabled
              ]}>
                {isAnalyzingHealth ? 'Analyzing...' : 'Health Check'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <TreePine size={16} color="#22C55E" />
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{identification.morphology?.plantType || 'Unknown'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Leaf size={16} color="#22C55E" />
                <Text style={styles.infoLabel}>Family</Text>
                <Text style={styles.infoValue}>{identification.family || 'Unknown'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Target size={16} color="#22C55E" />
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{identification.morphology?.height || 'Unknown'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Calendar size={16} color="#22C55E" />
                <Text style={styles.infoLabel}>Identified</Text>
                <Text style={styles.infoValue}>{formatDate(identification.timestamp)}</Text>
              </View>
            </View>
          </View>

          {/* Common Names */}
          {(identification.commonNames?.length || 0) > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Common Names</Text>
              <View style={styles.tagsContainer}>
                {(identification.commonNames || []).map((name: string) => (
                  <View key={name} style={styles.tag}>
                    <Text style={styles.tagText}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{identification.description || 'No description available.'}</Text>
          </View>

          {/* Care Requirements */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Care Requirements</Text>
            <View style={styles.careGrid}>
              <View style={styles.careItem}>
                <Sun size={20} color="#F59E0B" />
                <Text style={styles.careLabel}>Light</Text>
                <Text style={styles.careValue}>{identification.lightRequirements || 'Unknown'}</Text>
              </View>
              <View style={styles.careItem}>
                <Droplets size={20} color="#3B82F6" />
                <Text style={styles.careLabel}>Water</Text>
                <Text style={styles.careValue}>{identification.waterRequirements || 'Unknown'}</Text>
              </View>
              <View style={styles.careItem}>
                <Leaf size={20} color="#8B5CF6" />
                <Text style={styles.careLabel}>Soil</Text>
                <Text style={styles.careValue}>{identification.soilType || 'Unknown'}</Text>
              </View>
            </View>
          </View>

          {/* Care Instructions */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Care Instructions</Text>
            <Text style={styles.careInstructions}>{identification.careInstructions || 'No care instructions available.'}</Text>
          </View>

          {/* Taxonomy */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Scientific Classification</Text>
            <View style={styles.taxonomyGrid}>
              <View style={styles.taxonomyItem}>
                <Text style={styles.taxonomyLabel}>Kingdom:</Text>
                <Text style={styles.taxonomyValue}>{identification.taxonomy?.kingdom || 'Unknown'}</Text>
              </View>
              <View style={styles.taxonomyItem}>
                <Text style={styles.taxonomyLabel}>Family:</Text>
                <Text style={styles.taxonomyValue}>{identification.taxonomy?.family || 'Unknown'}</Text>
              </View>
              <View style={styles.taxonomyItem}>
                <Text style={styles.taxonomyLabel}>Genus:</Text>
                <Text style={styles.taxonomyValue}>{identification.taxonomy?.genus || 'Unknown'}</Text>
              </View>
              <View style={styles.taxonomyItem}>
                <Text style={styles.taxonomyLabel}>Species:</Text>
                <Text style={styles.taxonomyValue}>{identification.taxonomy?.species || 'Unknown'}</Text>
              </View>
            </View>
          </View>

          {/* Morphology */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Physical Characteristics</Text>
            <View style={styles.morphologyGrid}>
              <View style={styles.morphologyItem}>
                <Leaf size={18} color="#22C55E" />
                <View style={styles.morphologyContent}>
                  <Text style={styles.morphologyLabel}>Leaf Shape</Text>
                  <Text style={styles.morphologyValue}>{identification.morphology?.leafShape || 'Unknown'}</Text>
                </View>
              </View>
              <View style={styles.morphologyItem}>
                <Flower size={18} color="#EC4899" />
                <View style={styles.morphologyContent}>
                  <Text style={styles.morphologyLabel}>Flower Colors</Text>
                  <Text style={styles.morphologyValue}>{identification.morphology?.flowerColor?.join(', ') || 'Unknown'}</Text>
                </View>
              </View>
              <View style={styles.morphologyItem}>
                <TreePine size={18} color="#8B5CF6" />
                <View style={styles.morphologyContent}>
                  <Text style={styles.morphologyLabel}>Root System</Text>
                  <Text style={styles.morphologyValue}>{identification.morphology?.rootSystem || 'Unknown'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Habitat & Distribution */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Habitat & Distribution</Text>
            <View style={styles.habitatGrid}>
              <View style={styles.habitatItem}>
                <Globe size={16} color="#3B82F6" />
                <Text style={styles.habitatLabel}>Climate</Text>
                <Text style={styles.habitatValue}>{identification.habitat?.climate || 'Unknown'}</Text>
              </View>
              <View style={styles.habitatItem}>
                <Thermometer size={16} color="#EF4444" />
                <Text style={styles.habitatLabel}>Temperature</Text>
                <Text style={styles.habitatValue}>{identification.habitat?.temperatureRange || 'Unknown'}</Text>
              </View>
              <View style={styles.habitatItem}>
                <MapPin size={16} color="#10B981" />
                <Text style={styles.habitatLabel}>Hardiness</Text>
                <Text style={styles.habitatValue}>{identification.habitat?.hardiness || 'Unknown'}</Text>
              </View>
            </View>
            <View style={styles.distributionContainer}>
              <Text style={styles.distributionTitle}>Native Regions</Text>
              <View style={styles.tagsContainer}>
                {(identification.distribution?.nativeRegions || []).map((region: string) => (
                  <View key={region} style={styles.regionTag}>
                    <Text style={styles.regionTagText}>{region}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Uses */}
          {((identification.uses?.medicinal?.length || 0) > 0 || (identification.uses?.culinary?.length || 0) > 0 || (identification.uses?.ornamental?.length || 0) > 0) && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Uses & Applications</Text>
              {(identification.uses?.medicinal?.length || 0) > 0 && (
                <View style={styles.useCategory}>
                  <View style={styles.useCategoryHeader}>
                    <Heart size={16} color="#EF4444" />
                    <Text style={styles.useCategoryTitle}>Medicinal</Text>
                  </View>
                  <View style={styles.usesList}>
                    {(identification.uses?.medicinal || []).map((use: string) => (
                      <Text key={`medicinal-${use}`} style={styles.useItem}>- {use}</Text>
                    ))}
                  </View>
                </View>
              )}
              {(identification.uses?.culinary?.length || 0) > 0 && (
                <View style={styles.useCategory}>
                  <View style={styles.useCategoryHeader}>
                    <Leaf size={16} color="#22C55E" />
                    <Text style={styles.useCategoryTitle}>Culinary</Text>
                  </View>
                  <View style={styles.usesList}>
                    {(identification.uses?.culinary || []).map((use: string) => (
                      <Text key={`culinary-${use}`} style={styles.useItem}>- {use}</Text>
                    ))}
                  </View>
                </View>
              )}
              {(identification.uses?.ornamental?.length || 0) > 0 && (
                <View style={styles.useCategory}>
                  <View style={styles.useCategoryHeader}>
                    <Flower size={16} color="#EC4899" />
                    <Text style={styles.useCategoryTitle}>Ornamental</Text>
                  </View>
                  <View style={styles.usesList}>
                    {(identification.uses?.ornamental || []).map((use: string) => (
                      <Text key={`ornamental-${use}`} style={styles.useItem}>- {use}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Seasonality */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Seasonal Information</Text>
            <View style={styles.seasonalityGrid}>
              <View style={styles.seasonalityItem}>
                <Flower size={16} color="#EC4899" />
                <Text style={styles.seasonalityLabel}>Blooming</Text>
                <Text style={styles.seasonalityValue}>{identification.seasonality?.bloomingSeason?.join(', ') || 'Unknown'}</Text>
              </View>
              <View style={styles.seasonalityItem}>
                <Calendar size={16} color="#22C55E" />
                <Text style={styles.seasonalityLabel}>Best Planting</Text>
                <Text style={styles.seasonalityValue}>{identification.seasonality?.bestPlantingTime?.join(', ') || 'Unknown'}</Text>
              </View>
              <View style={styles.seasonalityItem}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.seasonalityLabel}>Dormancy</Text>
                <Text style={styles.seasonalityValue}>{identification.seasonality?.dormancyPeriod || 'Unknown'}</Text>
              </View>
            </View>
          </View>

          {/* Propagation */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Propagation</Text>
            <View style={styles.propagationContainer}>
              <View style={styles.propagationHeader}>
                <Scissors size={18} color="#8B5CF6" />
                <View style={styles.propagationInfo}>
                  <Text style={styles.propagationDifficulty}>Difficulty: {identification.propagation?.difficulty || 'Unknown'}</Text>
                  <Text style={styles.propagationTime}>Time to Maturity: {identification.propagation?.timeToMaturity || 'Unknown'}</Text>
                </View>
              </View>
              <Text style={styles.propagationMethodsTitle}>Methods:</Text>
              <View style={styles.tagsContainer}>
                {(identification.propagation?.methods || []).map((method: string) => (
                  <View key={method} style={styles.methodTag}>
                    <Text style={styles.methodTagText}>{method}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Companion Plants */}
          {(identification.companionPlants?.length || 0) > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Companion Plants</Text>
              <View style={styles.tagsContainer}>
                {(identification.companionPlants || []).map((plant: string) => (
                  <View key={plant} style={styles.companionTag}>
                    <Text style={styles.companionTagText}>{plant}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pests & Diseases */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Common Issues</Text>
            <View style={styles.issuesContainer}>
              <View style={styles.issueCategory}>
                <View style={styles.issueCategoryHeader}>
                  <Bug size={16} color="#EF4444" />
                  <Text style={styles.issueCategoryTitle}>Common Pests</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {(identification.pests || []).map((pest: string) => (
                    <View key={pest} style={styles.pestTag}>
                      <Text style={styles.pestTagText}>{pest}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.issueCategory}>
                <View style={styles.issueCategoryHeader}>
                  <Shield size={16} color="#F59E0B" />
                  <Text style={styles.issueCategoryTitle}>Common Diseases</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {(identification.diseases || []).map((disease: string) => (
                    <View key={disease} style={styles.diseaseTag}>
                      <Text style={styles.diseaseTagText}>{disease}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Conservation Status */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Conservation Status</Text>
            <View style={styles.conservationContainer}>
              <View style={styles.conservationHeader}>
                <Award size={18} color={identification.conservationStatus?.status === 'LC' ? '#22C55E' : '#F59E0B'} />
                <View style={styles.conservationInfo}>
                  <Text style={styles.conservationStatus}>{identification.conservationStatus?.statusDescription || 'Unknown'}</Text>
                  <Text style={styles.conservationCode}>({identification.conservationStatus?.status || 'Unknown'})</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cultural Significance */}
          {identification.culturalSignificance && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Cultural Significance</Text>
              <Text style={styles.culturalText}>{identification.culturalSignificance}</Text>
            </View>
          )}

          {/* Interesting Facts */}
          {(identification.interestingFacts?.length || 0) > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Interesting Facts</Text>
              <View style={styles.factsContainer}>
                {(identification.interestingFacts || []).map((fact: string) => (
                  <View key={`fact-${fact.substring(0, 20)}`} style={styles.factItem}>
                    <Zap size={14} color="#F59E0B" />
                    <Text style={styles.factText}>{fact}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Safety Warnings */}
          {(identification.isToxic !== undefined || identification.isEdible !== undefined) && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Safety Information</Text>
              <View style={styles.safetyContainer}>
                {identification.isToxic && (
                  <View style={styles.warningItem}>
                    <AlertTriangle size={16} color="#EF4444" />
                    <Text style={styles.warningText}>Toxic - Keep away from children and pets</Text>
                  </View>
                )}
                {identification.isEdible && (
                  <View style={styles.safetyItem}>
                    <CheckCircle size={16} color="#22C55E" />
                    <Text style={styles.safetyText}>Edible - Safe for consumption</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Scanning overlay when analyzing health */}
      <ScanningOverlay 
        isVisible={isAnalyzingHealth} 
        message="Analyzing plant health..."
      />
      
      <HealthCheckModal
        isVisible={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        hasCurrentImage={!!identification?.imageUri}
        onUseCurrentImage={async () => {
          setShowHealthModal(false);
          try {
            console.log('Starting health analysis with current image:', identification.imageUri);
            const healthRecord = await analyzeHealth(identification.imageUri, identification.id);
            console.log('Health analysis completed successfully, health record ID:', healthRecord.id);
            // Navigate to health report using the health record ID
            router.push(`/health-report?id=${healthRecord.id}&source=plant-details`);
          } catch (error) {
            console.error('Health analysis failed:', error);
            showAlert('Error', 'Failed to analyze plant health. Please try again.');
          }
        }}
        onOpenCamera={() => {
          setShowHealthModal(false);
          router.push('/camera?mode=health');
        }}
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 400,
    backgroundColor: Colors.gray100,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  shareButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  plantName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  addToGardenButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToGardenButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  addToGardenButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  healthCheckButton: {
    flex: 1,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  healthCheckButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  healthCheckButtonDisabled: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray300,
  },
  healthCheckButtonTextDisabled: {
    color: Colors.gray400,
  },
  infoSection: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  tagText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  careGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  careItem: {
    alignItems: 'center',
    flex: 1,
  },
  careLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  careValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'center',
  },
  careInstructions: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  additionalInfo: {
    gap: 12,
  },
  additionalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  additionalValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  safetyContainer: {
    gap: 8,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
    marginLeft: 8,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  safetyText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  // Enhanced styles for new sections
  taxonomyGrid: {
    gap: 8,
  },
  taxonomyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  taxonomyLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  taxonomyValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  morphologyGrid: {
    gap: 16,
  },
  morphologyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  morphologyContent: {
    marginLeft: 12,
    flex: 1,
  },
  morphologyLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  morphologyValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  habitatGrid: {
    gap: 12,
    marginBottom: 16,
  },
  habitatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  habitatValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  distributionContainer: {
    marginTop: 8,
  },
  distributionTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  regionTag: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  regionTagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  useCategory: {
    marginBottom: 16,
  },
  useCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  useCategoryTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginLeft: 8,
  },
  usesList: {
    marginLeft: 24,
  },
  useItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  seasonalityGrid: {
    gap: 12,
  },
  seasonalityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonalityLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  seasonalityValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  propagationContainer: {
    gap: 12,
  },
  propagationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propagationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  propagationDifficulty: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  propagationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  propagationMethodsTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  methodTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  methodTagText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  companionTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  companionTagText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  issuesContainer: {
    gap: 16,
  },
  issueCategory: {
    gap: 8,
  },
  issueCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueCategoryTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginLeft: 8,
  },
  pestTag: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pestTagText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  diseaseTag: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  diseaseTagText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  conservationContainer: {
    gap: 8,
  },
  conservationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conservationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  conservationStatus: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  conservationCode: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  culturalText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  factsContainer: {
    gap: 12,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  factText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});



