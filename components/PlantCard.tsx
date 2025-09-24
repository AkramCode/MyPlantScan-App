import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Leaf, Calendar } from 'lucide-react-native';
import { PlantIdentification } from '@/types/plant';

interface PlantCardProps {
  identification: PlantIdentification;
  onPress: () => void;
  compact?: boolean;
}

export default function PlantCard({ identification, onPress, compact = false }: PlantCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#22C55E';
    if (confidence >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <TouchableOpacity style={[styles.container, compact && styles.compactContainer]} onPress={onPress}>
      {identification.imageUri ? (
        <Image source={{ uri: identification.imageUri }} style={[styles.image, compact && styles.compactImage]} />
      ) : (
        <View style={[styles.image, styles.placeholderImage, compact && styles.compactImage]}>
          <Leaf size={compact ? 32 : 48} color="#9CA3AF" />
        </View>
      )}
      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.header}>
          <Text style={[styles.plantName, compact && styles.compactPlantName]} numberOfLines={1}>
            {identification.plantName}
          </Text>
          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(identification.confidence) }]}>
            <Text style={styles.confidenceText}>
              {Math.round(identification.confidence * 100)}%
            </Text>
          </View>
        </View>
        
        <Text style={[styles.scientificName, compact && styles.compactScientificName]} numberOfLines={1}>
          {identification.scientificName}
        </Text>
        
        {!compact && (
          <View style={styles.footer}>
            <View style={styles.familyContainer}>
              <Leaf size={14} color="#6B7280" />
              <Text style={styles.family}>{identification.family}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.date}>{formatDate(identification.timestamp)}</Text>
            </View>
          </View>
        )}
        
        {compact && (
          <View style={styles.compactFooter}>
            <Text style={styles.compactDate}>{formatDate(identification.timestamp)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  family: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactContainer: {
    marginHorizontal: 0,
    marginVertical: 4,
  },
  compactImage: {
    height: 120,
  },
  compactContent: {
    padding: 12,
  },
  compactPlantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactScientificName: {
    fontSize: 12,
    marginBottom: 8,
  },
  compactFooter: {
    alignItems: 'center',
  },
  compactDate: {
    fontSize: 10,
    color: '#6B7280',
  },
});