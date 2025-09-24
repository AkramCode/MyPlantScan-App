import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { Plus, Calendar, MapPin, Clock, BookOpen, Trash2, X } from 'lucide-react-native';
import { usePlantStore } from '@/hooks/plant-store';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GardenScreen() {
  const { userPlants, identifications, removeFromGarden } = usePlantStore();
  const [activeTab, setActiveTab] = useState<'saved' | 'recent'>('saved');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [plantToRemove, setPlantToRemove] = useState<{ id: string; name: string } | null>(null);
  const insets = useSafeAreaInsets();
  
  const handleRemovePlant = (plantId: string, plantName: string) => {
    setPlantToRemove({ id: plantId, name: plantName });
    setShowRemoveModal(true);
  };
  
  const confirmRemovePlant = async () => {
    if (!plantToRemove) return;
    
    try {
      await removeFromGarden(plantToRemove.id);
      setShowRemoveModal(false);
      setPlantToRemove(null);
    } catch (error) {
      console.error('Error removing plant:', error);
    }
  };
  
  const cancelRemovePlant = () => {
    setShowRemoveModal(false);
    setPlantToRemove(null);
  };
  
  const recentIdentifications = identifications.slice(0, 10);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysAgo = (timestamp: number) => {
    const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Garden</Text>
            <Text style={styles.subtitle}>
              {userPlants.length} saved • {identifications.length} identified
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/camera')}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <BookOpen size={16} color={activeTab === 'saved' ? '#22C55E' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
              Saved Plants ({userPlants.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
            onPress={() => setActiveTab('recent')}
          >
            <Clock size={16} color={activeTab === 'recent' ? '#22C55E' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
              Recent ({identifications.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Garden Stats */}
        {userPlants.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userPlants.length}</Text>
              <Text style={styles.statLabel}>Total Plants</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {userPlants.filter(p => p.lastWatered && Date.now() - p.lastWatered < 7 * 24 * 60 * 60 * 1000).length}
              </Text>
              <Text style={styles.statLabel}>Watered This Week</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {new Set(userPlants.map(p => p.location)).size}
              </Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>
          </View>
        )}

        {/* Content based on active tab */}
        {activeTab === 'saved' ? (
          /* Saved Plants */
          userPlants.length > 0 ? (
            <View style={styles.plantsGrid}>
              {userPlants.map((plant) => (
                <View key={plant.id} style={styles.plantCard}>
                  <TouchableOpacity 
                    style={styles.plantCardContent}
                    onPress={() => router.push(`/plant-details?id=${plant.identificationId}`)}
                  >
                    <Image source={{ uri: plant.imageUri }} style={styles.plantImage} />
                    <View style={styles.plantInfo}>
                      <View style={styles.plantHeader}>
                        <View style={styles.plantTitleContainer}>
                          <Text style={styles.plantName} numberOfLines={1}>
                            {plant.plantName}
                          </Text>
                          <Text style={styles.scientificName} numberOfLines={1}>
                            {plant.scientificName}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => handleRemovePlant(plant.id, plant.plantName)}
                          testID={`remove-plant-${plant.id}`}
                          accessibilityLabel={`Remove ${plant.plantName} from garden`}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.plantMeta}>
                        <View style={styles.metaItem}>
                          <Calendar size={12} color="#6B7280" />
                          <Text style={styles.metaText}>
                            {getDaysAgo(plant.dateAdded)}
                          </Text>
                        </View>
                        
                        {plant.location && (
                          <View style={styles.metaItem}>
                            <MapPin size={12} color="#6B7280" />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {plant.location}
                            </Text>
                          </View>
                        )}
                      </View>

                      {plant.lastWatered && (
                        <View style={styles.wateringInfo}>
                          <Text style={styles.wateringText}>
                            Last watered: {formatDate(plant.lastWatered)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            /* Empty State for Saved Plants */
            <View style={styles.emptyState}>
              <BookOpen size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Saved Plants</Text>
              <Text style={styles.emptyDescription}>
                Save plants to your garden from your recent identifications
              </Text>
              <TouchableOpacity 
                style={styles.emptyAction}
                onPress={() => setActiveTab('recent')}
              >
                <Text style={styles.emptyActionText}>View Recent Identifications</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* Recent Identifications */
          recentIdentifications.length > 0 ? (
            <View style={styles.plantsGrid}>
              {recentIdentifications.map((identification) => {
                const isInGarden = userPlants.some(p => p.identificationId === identification.id);
                return (
                  <TouchableOpacity 
                    key={identification.id} 
                    style={styles.plantCard}
                    onPress={() => router.push(`/plant-details?id=${identification.id}`)}
                  >
                    <Image source={{ uri: identification.imageUri }} style={styles.plantImage} />
                    <View style={styles.plantInfo}>
                      <View style={styles.plantHeader}>
                        <View style={styles.plantTitleContainer}>
                          <Text style={styles.plantName} numberOfLines={1}>
                            {identification.plantName}
                          </Text>
                          <Text style={styles.scientificName} numberOfLines={1}>
                            {identification.scientificName}
                          </Text>
                        </View>
                        {isInGarden && (
                          <View style={styles.savedBadge}>
                            <Text style={styles.savedBadgeText}>Saved</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.plantMeta}>
                        <View style={styles.metaItem}>
                          <Calendar size={12} color="#6B7280" />
                          <Text style={styles.metaText}>
                            {getDaysAgo(identification.timestamp)}
                          </Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                          <Text style={styles.confidenceText}>
                            {Math.round(identification.confidence * 100)}% match
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Empty State for Recent Identifications */
            <View style={styles.emptyState}>
              <Clock size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Recent Identifications</Text>
              <Text style={styles.emptyDescription}>
                Start identifying plants to see them here
              </Text>
              <TouchableOpacity 
                style={styles.emptyAction}
                onPress={() => router.push('/camera')}
              >
                <Text style={styles.emptyActionText}>Identify Your First Plant</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
      
      {/* Remove Plant Modal */}
      <Modal
        visible={showRemoveModal}
        transparent
        animationType="fade"
        onRequestClose={cancelRemovePlant}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Plant</Text>
              <TouchableOpacity onPress={cancelRemovePlant} style={styles.modalCloseButton}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to remove &ldquo;{plantToRemove?.name}&rdquo; from your garden?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={cancelRemovePlant}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalRemoveButton}
                onPress={confirmRemovePlant}
              >
                <Text style={styles.modalRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#22C55E',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  plantsGrid: {
    paddingHorizontal: 16,
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  plantCardContent: {
    flex: 1,
  },
  plantImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  plantInfo: {
    padding: 16,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 12,
  },
  plantMeta: {
    gap: 8,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  wateringInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  wateringText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyAction: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  plantTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  savedBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalRemoveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalRemoveText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});