import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera, X, Image as ImageIcon } from 'lucide-react-native';
import { Colors } from '@/constants/colors';



interface HealthCheckModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUseCurrentImage: () => void;
  onOpenCamera: () => void;
  hasCurrentImage: boolean;
}

export default function HealthCheckModal({
  isVisible,
  onClose,
  onUseCurrentImage,
  onOpenCamera,
  hasCurrentImage,
}: HealthCheckModalProps) {


  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType='slide'
        onRequestClose={onClose}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <View style={styles.container}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
            
            <View style={styles.modal}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.handle} />
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Health Check Options</Text>
                  <Text style={styles.subtitle}>Choose how to analyze your plant</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color={Colors.gray500} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.options}>
                {hasCurrentImage && (
                  <TouchableOpacity style={styles.option} onPress={onUseCurrentImage}>
                    <View style={[styles.optionIcon, { backgroundColor: Colors.primaryLight }]}>
                      <ImageIcon size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>Use Current Image</Text>
                      <Text style={styles.optionDescription}>
                        Analyze the plant image already shown
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.option} onPress={onOpenCamera}>
                  <View style={[styles.optionIcon, { backgroundColor: Colors.secondaryLight }]}>
                    <Camera size={24} color={Colors.secondary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Take New Photo</Text>
                    <Text style={styles.optionDescription}>
                      Open camera to capture or upload a new image
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Tips */}
              <View style={styles.tips}>
                <Text style={styles.tipsTitle}>Tips for better analysis</Text>
                <View style={styles.tipsList}>
                  <Text style={styles.tip}>- Focus on affected areas (leaves, stems, flowers)</Text>
                  <Text style={styles.tip}>- Ensure good lighting for clear details</Text>
                  <Text style={styles.tip}>- Include multiple angles if possible</Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType='slide'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Health Check Options</Text>
              <Text style={styles.subtitle}>Choose how to analyze your plant</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.gray500} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {hasCurrentImage && (
              <TouchableOpacity style={styles.option} onPress={onUseCurrentImage}>
                <View style={[styles.optionIcon, { backgroundColor: Colors.primaryLight }]}>
                  <ImageIcon size={24} color={Colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Use Current Image</Text>
                  <Text style={styles.optionDescription}>
                    Analyze the plant image already shown
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.option} onPress={onOpenCamera}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.secondaryLight }]}>
                <Camera size={24} color={Colors.secondary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Take New Photo</Text>
                <Text style={styles.optionDescription}>
                  Open camera to capture or upload a new image
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for better analysis</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>- Focus on affected areas (leaves, stems, flowers)</Text>
              <Text style={styles.tip}>- Ensure good lighting for clear details</Text>
              <Text style={styles.tip}>- Include multiple angles if possible</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '70%',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  options: {
    padding: 20,
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tips: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  tipsList: {
    gap: 6,
  },
  tip: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});







