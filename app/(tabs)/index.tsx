import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Camera, Leaf, BookOpen } from 'lucide-react-native';
import { usePlantStore } from '@/hooks/plant-store';
import { PlantIdentification } from '@/types/plant';
import PlantCard from '@/components/PlantCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { identifications, userPlants, isLoading } = usePlantStore();
  const insets = useSafeAreaInsets();

  const recentIdentifications: PlantIdentification[] = identifications.slice(0, 10);
  const stats = {
    totalIdentifications: identifications.length,
    plantsInGarden: userPlants.length,
    thisWeek: identifications.filter((id: PlantIdentification) => 
      Date.now() - id.timestamp < 7 * 24 * 60 * 60 * 1000
    ).length,
  };

  const handlePlantPress = (identification: PlantIdentification) => {
    router.push(`/plant-details?id=${identification.id}&source=home`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.appName}>MyPlantScan</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.primaryAction}
            onPress={() => router.push('/camera')}
          >
            <Camera size={24} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>Identify Plant</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.secondaryAction}
              onPress={() => router.push('/health')}
            >
              <Leaf size={20} color="#22C55E" />
              <Text style={styles.secondaryActionText}>Health Check</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryAction}
              onPress={() => router.push('/garden')}
            >
              <BookOpen size={20} color="#22C55E" />
              <Text style={styles.secondaryActionText}>My Garden</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalIdentifications}</Text>
            <Text style={styles.statLabel}>Plants Identified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.plantsInGarden}</Text>
            <Text style={styles.statLabel}>In Garden</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Recent Identifications */}
        {recentIdentifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Identifications</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/garden')}>
                <Text style={styles.seeAll}>More</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.cardsGrid}>
              {recentIdentifications.map((identification) => (
                <View key={identification.id} style={styles.cardWrapper}>
                  <PlantCard
                    identification={identification}
                    onPress={() => handlePlantPress(identification)}
                    compact={true}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {identifications.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Leaf size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Start Your Plant Journey</Text>
            <Text style={styles.emptyDescription}>
              Take a photo of any plant to identify it and learn more about it
            </Text>
            <TouchableOpacity 
              style={styles.emptyAction}
              onPress={() => router.push('/camera')}
            >
              <Text style={styles.emptyActionText}>Identify Your First Plant</Text>
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  primaryAction: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
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
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 8,
  },
  cardWrapper: {
    width: '48%',
  },
});
