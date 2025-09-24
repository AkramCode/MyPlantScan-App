export const Colors = {
  // Primary Colors
  primary: '#22C55E',
  primaryLight: '#DCFCE7',
  primaryDark: '#16A34A',
  
  // Secondary Colors
  secondary: '#3B82F6',
  secondaryLight: '#EBF8FF',
  secondaryDark: '#1D4ED8',
  
  // Accent Colors
  accent: '#8B5CF6',
  accentLight: '#F3E8FF',
  accentDark: '#7C3AED',
  
  // Status Colors
  success: '#22C55E',
  successLight: '#F0FDF4',
  successBorder: '#BBF7D0',
  
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',
  
  error: '#EF4444',
  errorLight: '#FEF2F2',
  errorBorder: '#FECACA',
  
  info: '#3B82F6',
  infoLight: '#EBF8FF',
  infoBorder: '#BFDBFE',
  
  // Health Status Colors
  healthy: '#22C55E',
  diseased: '#EF4444',
  pest: '#F59E0B',
  nutrientDeficiency: '#F59E0B',
  overwatered: '#3B82F6',
  underwatered: '#F59E0B',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Special Colors
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Plant Care Colors
  sun: '#F59E0B',
  water: '#3B82F6',
  soil: '#8B5CF6',
  flower: '#EC4899',
  leaf: '#22C55E',
  
  // Background Colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  
  // Text Colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;

// Helper function to get color value
export const getColor = (key: ColorKey): string => Colors[key];

// Health status color mapping
export const getHealthStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy': return Colors.healthy;
    case 'diseased': return Colors.diseased;
    case 'pest': return Colors.pest;
    case 'nutrient_deficiency': return Colors.nutrientDeficiency;
    case 'overwatered': return Colors.overwatered;
    case 'underwatered': return Colors.underwatered;
    default: return Colors.gray500;
  }
};

// Confidence level color mapping
export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return Colors.success;
  if (confidence >= 0.6) return Colors.warning;
  return Colors.error;
};

// Severity color mapping
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'high': return Colors.error;
    case 'medium': return Colors.warning;
    case 'low': return Colors.success;
    default: return Colors.gray500;
  }
};