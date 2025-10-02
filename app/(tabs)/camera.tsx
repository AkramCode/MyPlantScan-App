import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert, AppState, AppStateStatus, Linking } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, CameraMountError } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, Stack, useLocalSearchParams } from 'expo-router';
import { Camera, Image as ImageIcon, RotateCcw, X, Check } from 'lucide-react-native';
import { usePlantStore } from '@/hooks/plant-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScanningOverlay from '@/components/ScanningOverlay';

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isScreenFocused, setIsScreenFocused] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const cameraRef = useRef<CameraView>(null);
  const { identifyPlant, analyzeHealth, isIdentifying, isAnalyzingHealth } = usePlantStore();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  
  const isHealthMode = mode === 'health';
  const isProcessing = isHealthMode ? isAnalyzingHealth : isIdentifying;
  
  // Debug log for processing state
  useEffect(() => {
    console.log('Processing state changed:', { isIdentifying, isAnalyzingHealth, isHealthMode });
  }, [isIdentifying, isAnalyzingHealth, isHealthMode]);
  const insets = useSafeAreaInsets();
  const mountedRef = useRef<boolean>(true);
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const cleanupCamera = useCallback(() => {
    console.log('Cleaning up camera resources');
    
    // Clear all pending timeouts
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
    if (activationTimeoutRef.current) {
      clearTimeout(activationTimeoutRef.current);
      activationTimeoutRef.current = null;
    }
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Reset all camera states
    setCameraReady(false);
    setIsCameraActive(false);
    
    // Web-specific cleanup for MediaStream
    if (Platform.OS === 'web') {
      try {
        if (cameraRef.current) {
          const videoElement = cameraRef.current as any;
          if (videoElement?.srcObject) {
            const stream = videoElement.srcObject;
            if (stream?.getTracks) {
              stream.getTracks().forEach((track: any) => {
                if (track.readyState === 'live') {
                  track.stop();
                }
              });
            }
            videoElement.srcObject = null;
          }
        }
      } catch (error) {
        console.warn('Error during web camera cleanup:', error);
      }
    }
  }, []);

  const closeCamera = useCallback(() => {
    console.log('Closing camera');
    
    // Immediate cleanup
    cleanupCamera();
    setIsScreenFocused(false);
    
    // Navigate back to the correct screen based on mode
    if (isHealthMode) {
      router.replace('/(tabs)/health');
    } else {
      router.replace('/(tabs)');
    }
  }, [cleanupCamera, isHealthMode]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || !isCameraActive || !cameraReady || !mountedRef.current || isInitializing) {
      console.log('Camera not ready for taking picture:', { 
        hasRef: !!cameraRef.current, 
        isActive: isCameraActive, 
        isReady: cameraReady, 
        isMounted: mountedRef.current,
        isInitializing 
      });
      return;
    }

    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: Platform.OS === 'web',
        exif: false,
        base64: false, // Disable base64 to reduce memory usage
      });
      
      if (photo?.uri && mountedRef.current) {
        console.log('Picture taken successfully:', photo.uri);
        setCapturedImage(photo.uri);
        
        // Properly deactivate camera after capture
        setCameraReady(false);
        setIsCameraActive(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  }, [isCameraActive, cameraReady, isInitializing]);

  const pickImage = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      // Ensure we have library permission before opening picker
      const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // Permission denied - instruct user to enable from settings
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Photo access required',
            'To upload images from your library, enable photo access in device settings.',
            [
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && mountedRef.current) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS !== 'web' && mountedRef.current) {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    }
  }, []);

  const processImage = useCallback(async () => {
    if (!capturedImage || !mountedRef.current) return;

    try {
      if (isHealthMode) {
        console.log('Starting plant health analysis...');
        const healthRecord = await analyzeHealth(capturedImage);
        if (mountedRef.current) {
          // Complete cleanup before navigation
          cleanupCamera();
          
          // Navigate after cleanup
          cleanupTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              router.replace(`/health-report?id=${healthRecord.id}&source=camera`);
            }
          }, 150);
        }
      } else {
        console.log('Starting plant identification...');
        const identification = await identifyPlant(capturedImage);
        if (mountedRef.current) {
          // Complete cleanup before navigation
          cleanupCamera();
          
          // Navigate after cleanup
          cleanupTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              router.push(`/plant-details?id=${identification.id}&source=camera`);
            }
          }, 150);
        }
      }
    } catch (error) {
      console.error(`Error ${isHealthMode ? 'analyzing health' : 'identifying plant'}:`, error);
      if (mountedRef.current) {
        Alert.alert('Error', `Failed to ${isHealthMode ? 'analyze plant health' : 'identify plant'}. Please try again.`);
      }
    }
  }, [capturedImage, isHealthMode, analyzeHealth, identifyPlant, cleanupCamera]);

  const retakePhoto = useCallback(() => {
    if (mountedRef.current) {
      setCapturedImage(null);
      setIsInitializing(true);
      setCameraReady(false);
      
      // Simple reactivation
      if (permission?.granted && isScreenFocused) {
        setIsCameraActive(true);
      }
    }
  }, [permission?.granted, isScreenFocused]);

  const toggleCameraFacing = useCallback(() => {
    if (isCameraActive && cameraReady && mountedRef.current && !isInitializing) {
      setCameraReady(false); // Reset ready state when switching
      setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
    }
  }, [isCameraActive, cameraReady, isInitializing]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed:', appStateRef.current, '->', nextAppState);
      
      if (nextAppState.match(/inactive|background/)) {
        console.log('App going to background, cleaning up camera');
        cleanupCamera();
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [cleanupCamera]);

  // Handle camera lifecycle with focus/blur events
  useFocusEffect(
    useCallback(() => {
      console.log('Camera screen focused');
      setIsScreenFocused(true);
      
      // Reset states on focus
      setCapturedImage(null);
      
      // Simple activation for fresh screen
      if (permission?.granted) {
        setIsInitializing(true);
        setIsCameraActive(true);
      }
      
      return () => {
        console.log('Camera screen unfocused, cleaning up');
        setIsScreenFocused(false);
        cleanupCamera();
      };
    }, [permission?.granted, cleanupCamera])
  );

  // Cleanup when component unmounts
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      console.log('Camera component unmounting');
      mountedRef.current = false;
      
      // Clear all timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (activationTimeoutRef.current) {
        clearTimeout(activationTimeoutRef.current);
      }
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      cleanupCamera();
    };
  }, [cleanupCamera]);

  // Handle camera ready state
  useEffect(() => {
    if (isCameraActive && isInitializing) {
      // Set a timeout to clear initialization state
      initTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setIsInitializing(false);
        }
      }, 2000);
    }
    
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [isCameraActive, isInitializing]);

  if (!permission) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container} />
      </>
    );
  }

  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <TouchableOpacity style={[styles.closeButton, { top: insets.top + 16 }]} onPress={closeCamera}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.permissionContainer}>
            <Camera size={64} color="#D1D5DB" />
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionDescription}>
              We need access to your camera to identify plants
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={async () => {
                try {
                  if (permission?.canAskAgain) {
                    const result = await requestPermission();
                    // If still not granted after request, guide to settings
                    if (!result?.granted) {
                      if (Platform.OS !== 'web') {
                        Alert.alert(
                          'Camera access required',
                          'To use the camera, enable camera access in device settings.',
                          [
                            { text: 'Open Settings', onPress: () => void Linking.openSettings() },
                            { text: 'Cancel', style: 'cancel' },
                          ]
                        );
                      }
                    }
                  } else {
                    // Cannot ask again — immediately direct to settings
                    if (Platform.OS !== 'web') {
                      Alert.alert(
                        'Camera access required',
                        'To use the camera, enable camera access in device settings.',
                        [
                          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      );
                    }
                  }
                } catch (e) {
                  console.error('Camera permission request failed:', e);
                }
              }}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  if (capturedImage) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <TouchableOpacity
              style={[styles.previewCloseButton, { top: insets.top + 16 }]}
              onPress={closeCamera}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                <X size={24} color="#FFFFFF" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.identifyButton, isProcessing && styles.identifyButtonDisabled]}
                onPress={processImage}
                disabled={isProcessing}
              >
                <Check size={24} color="#FFFFFF" />
                <Text style={styles.identifyButtonText}>
                  {isProcessing
                    ? isHealthMode
                      ? 'Analyzing...'
                      : 'Identifying...'
                    : isHealthMode
                    ? 'Analyze Health'
                    : 'Identify Plant'}
                </Text>
              </TouchableOpacity>
            </View>

            {isProcessing && (
              <ScanningOverlay
                isVisible={isProcessing}
                message={isHealthMode ? 'Analyzing plant health...' : 'Analyzing plant features...'}
              />
            )}
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {isCameraActive && permission?.granted && isScreenFocused && !capturedImage ? (
          <>
            <CameraView 
              style={styles.camera} 
              facing={facing} 
              ref={cameraRef}
              onCameraReady={() => {
                console.log('Camera is ready');
                if (mountedRef.current) {
                  setCameraReady(true);
                  setIsInitializing(false);
                }
              }}
              onMountError={(event: CameraMountError) => {
                console.error('Camera mount error:', event);
                if (mountedRef.current) {
                  cleanupCamera();
                  const errorMessage = event?.message?.trim()
                    ? 'Failed to initialize camera: ' + event.message.trim()
                    : 'Failed to initialize camera. Please try again.';
                  Alert.alert(
                    'Camera Error',
                    errorMessage,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          // Try to reinitialize after error
                          if (permission?.granted && isScreenFocused) {
                            setIsInitializing(true);
                            setIsCameraActive(true);
                          }
                        },
                      },
                    ],
                  );
                }
              }}
            />
            
            {/* Overlay positioned absolutely over the camera */}
            <View style={styles.overlay}>
              <TouchableOpacity style={[styles.closeButton, { top: insets.top + 16 }]} onPress={closeCamera}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.headerOverlay}>
                <Text style={styles.overlayTitle}>{isHealthMode ? 'Analyze Plant Health' : 'Identify Plant'}</Text>
                <Text style={styles.overlaySubtitle}>{isHealthMode ? 'Point your camera at the plant issue' : 'Point your camera at a plant'}</Text>
              </View>
              
              <View style={styles.centerContent}>
                <View style={styles.focusFrame} />
              </View>
              
              <View style={styles.bottomOverlay}>
                <View style={styles.controls}>
                  <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                    <ImageIcon size={24} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.captureButton, (!cameraReady || isInitializing) && styles.captureButtonDisabled]} 
                    onPress={takePicture}
                    disabled={!cameraReady || isInitializing}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                    <RotateCcw size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.tips}>
                  <Text style={styles.tipsTitle}>Tips for better results</Text>
                  <Text style={styles.tip}>{isHealthMode ? 'Focus on affected areas; include close-ups of symptoms; ensure even lighting' : 'Ensure good lighting; focus on leaves and flowers; keep the plant centered'}</Text>
              </View>
            </View>
            </View>
          </>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <TouchableOpacity style={[styles.closeButton, { top: insets.top + 16 }]} onPress={closeCamera}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Camera size={64} color="#D1D5DB" />
            <Text style={styles.placeholderText}>
              {!permission?.granted 
                ? 'Camera Permission Required' 
                : !isScreenFocused 
                ? 'Loading...' 
                : capturedImage
                ? 'Processing Image...'
                : isInitializing
                ? 'Starting Camera...'
                : 'Initializing Camera...'}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    pointerEvents: 'box-none',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  previewCloseButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlaySubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#22C55E',
    borderRadius: 20,
    backgroundColor: 'transparent',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    pointerEvents: 'box-none',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    pointerEvents: 'box-none',
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'auto',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#22C55E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    pointerEvents: 'auto',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22C55E',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'auto',
  },
  tips: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tip: {
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
    borderRadius: 12,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  identifyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#22C55E',
    borderRadius: 12,
  },
  identifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  identifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  placeholderText: {
    color: '#D1D5DB',
    fontSize: 16,
    marginTop: 16,
  },
});





