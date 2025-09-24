import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Heart, Camera, AlertTriangle, CheckCircle, Clock, FileText, Eye } from 'lucide-react-native';
import { usePlantStore } from '@/hooks/plant-store';
import { Colors, getHealthStatusColor } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ScanningOverlay from '@/components/ScanningOverlay';

export default function HealthScreen() {
  const { healthRecords, isAnalyzingHealth } = usePlantStore();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');



  const openHealthCamera = () => {
    router.push('/camera?mode=health');
  };



  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'diseased': return AlertTriangle;
      case 'pest': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredRecords = healthRecords.filter(record => {
    if (selectedFilter === 'all') return true;
    return record.healthStatus === selectedFilter;
  });

  const recentRecords = filteredRecords.slice(0, 10);

  const getHealthStats = () => {
    const total = healthRecords.length;
    const healthy = healthRecords.filter(r => r.healthStatus === 'healthy').length;
    const diseased = healthRecords.filter(r => r.healthStatus === 'diseased').length;
    const issues = healthRecords.filter(r => r.healthStatus !== 'healthy').length;
    
    return { total, healthy, diseased, issues };
  };

  const stats = getHealthStats();

  const filters = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'healthy', label: 'Healthy', count: stats.healthy },
    { key: 'diseased', label: 'Issues', count: stats.issues },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plant Health</Text>
          <Text style={styles.subtitle}>Check your plants for diseases and issues</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.analyzeButton, isAnalyzingHealth && styles.analyzeButtonDisabled]}
            onPress={openHealthCamera}
            disabled={isAnalyzingHealth}
          >
            <Camera size={24} color={Colors.white} />
            <Text style={styles.analyzeButtonText}>
              {isAnalyzingHealth ? 'Analyzing...' : 'Analyze Plant Health'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Health Statistics */}
        {healthRecords.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Health Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <FileText size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Checks</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
                  <CheckCircle size={20} color={Colors.success} />
                </View>
                <Text style={styles.statNumber}>{stats.healthy}</Text>
                <Text style={styles.statLabel}>Healthy</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.warningLight }]}>
                  <AlertTriangle size={20} color={Colors.warning} />
                </View>
                <Text style={styles.statNumber}>{stats.issues}</Text>
                <Text style={styles.statLabel}>Need Care</Text>
              </View>
            </View>
          </View>
        )}

        {/* Health Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Health Check Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tip}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.tipText}>Take clear photos of affected areas</Text>
            </View>
            <View style={styles.tip}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.tipText}>Include leaves, stems, and flowers</Text>
            </View>
            <View style={styles.tip}>
              <CheckCircle size={16} color={Colors.success} />
              <Text style={styles.tipText}>Good lighting helps accurate diagnosis</Text>
            </View>
          </View>
        </View>

        {/* Health Records */}
        {healthRecords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Health Records</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterTab,
                    selectedFilter === filter.key && styles.filterTabActive
                  ]}
                  onPress={() => setSelectedFilter(filter.key)}
                >
                  <Text style={[
                    styles.filterTabText,
                    selectedFilter === filter.key && styles.filterTabTextActive
                  ]}>
                    {filter.label} ({filter.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {recentRecords.map((record) => {
              const StatusIcon = getHealthStatusIcon(record.healthStatus);
              return (
                <TouchableOpacity 
                  key={record.id} 
                  style={styles.healthCard}
                  onPress={() => router.push(`/health-report?id=${record.id}`)}
                >
                  <Image source={{ uri: record.imageUri }} style={styles.healthImage} />
                  <View style={styles.healthContent}>
                    <View style={styles.healthHeader}>
                      <View style={styles.healthInfo}>
                        <Text style={styles.plantName} numberOfLines={1}>
                          {record.plantName || 'Unknown Plant'}
                        </Text>
                        <View style={styles.healthStatus}>
                          <StatusIcon 
                            size={14} 
                            color={getHealthStatusColor(record.healthStatus)} 
                          />
                          <Text style={[
                            styles.healthStatusText,
                            { color: getHealthStatusColor(record.healthStatus) }
                          ]}>
                            {record.healthStatus.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.healthMeta}>
                        <View style={styles.severityBadge}>
                          <Text style={[
                            styles.severityText,
                            { color: record.severity === 'high' ? Colors.error : 
                                     record.severity === 'medium' ? Colors.warning : Colors.success }
                          ]}>
                            {record.severity.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.dateContainer}>
                          <Clock size={12} color={Colors.textSecondary} />
                          <Text style={styles.date}>{formatDate(record.timestamp)}</Text>
                        </View>
                      </View>
                    </View>
                    
                    {record.diagnosis?.primaryCondition && (
                      <Text style={styles.diagnosis} numberOfLines={1}>
                        {record.diagnosis.primaryCondition}
                      </Text>
                    )}
                    
                    <View style={styles.cardFooter}>
                      <Eye size={14} color={Colors.textSecondary} />
                      <Text style={styles.viewReport}>View Full Report</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {healthRecords.length === 0 && (
          <View style={styles.emptyState}>
            <Heart size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No Health Records Yet</Text>
            <Text style={styles.emptyDescription}>
              Start monitoring your plants&apos; health by taking photos and getting AI-powered analysis
            </Text>
            <TouchableOpacity style={styles.emptyAction} onPress={openHealthCamera}>
              <Text style={styles.emptyActionText}>Check Plant Health</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* Scanning overlay when analyzing health */}
      <ScanningOverlay 
        isVisible={isAnalyzingHealth} 
        message="🔬 Analyzing plant health..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  analyzeButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  analyzeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
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
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  healthCard: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray200,
    minHeight: 80,
  },
  healthImage: {
    width: 80,
    height: 80,
    backgroundColor: Colors.gray100,
    resizeMode: 'cover',
  },
  healthContent: {
    flex: 1,
    padding: 12,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  healthInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  healthMeta: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.gray100,
    marginBottom: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  diagnosis: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewReport: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});