import { Colors } from '@/constants/colors';

export type IconName =
  | 'Sparkles'
  | 'Scan'
  | 'HeartPulse'
  | 'Camera'
  | 'Image'
  | 'Library'
  | 'CalendarCheck'
  | 'Cloud'
  | 'CheckCircle2'
  | 'Leaf';

export type OnboardingSlide = {
  key: string;
  title: string;
  description: string;
  icon: IconName;
  accent: string;
  requiresPermission?: 'camera' | 'library';
  permissionTitle?: string;
  permissionDescription?: string;
};

export const slides: OnboardingSlide[] = [
  {
    key: 'welcome',
    title: 'Welcome to MyPlantScan',
    description: 'Your intelligent companion for plant care. Identify plants instantly, monitor health, and grow a thriving garden.',
    icon: 'Leaf',
    accent: Colors.primary,
  },
  {
    key: 'identify',
    title: 'Identify Any Plant Instantly',
    description: 'Point your camera at any plant and get instant species identification with detailed information about care requirements.',
    icon: 'Scan',
    accent: Colors.primary,
  },
  {
    key: 'health',
    title: 'AI-Powered Health Analysis',
    description: 'Detect diseases, pests, and nutrient deficiencies early. Get actionable recommendations to keep your plants healthy.',
    icon: 'HeartPulse',
    accent: Colors.secondary,
  },
  {
    key: 'camera-permission',
    title: 'Enable Camera Access',
    description: 'We need camera access to identify plants and analyze their health in real-time.',
    icon: 'Camera',
    accent: Colors.primary,
    requiresPermission: 'camera',
    permissionTitle: 'Camera Access Required',
    permissionDescription: 'MyPlantScan needs camera access to capture photos of your plants for identification and health analysis.',
  },
  {
    key: 'library-permission',
    title: 'Access Your Photo Library',
    description: 'Import existing plant photos from your gallery for instant identification and analysis.',
    icon: 'Image',
    accent: Colors.accent,
    requiresPermission: 'library',
    permissionTitle: 'Photo Library Access',
    permissionDescription: 'Access your photo library to identify plants from existing photos and save plant images to your device.',
  },
  {
    key: 'garden',
    title: 'Build Your Digital Garden',
    description: 'Create a personal collection of all your plants. Track growth, save notes, and organize by location.',
    icon: 'Library',
    accent: Colors.leaf,
  },
  {
    key: 'care',
    title: 'Never Miss Care Tasks',
    description: 'Get personalized watering schedules, light recommendations, and reminders to keep your plants thriving.',
    icon: 'CalendarCheck',
    accent: Colors.water,
  },
  {
    key: 'sync',
    title: 'Sync Across All Devices',
    description: 'Your garden data is securely backed up and synced. Access your plant collection from anywhere.',
    icon: 'Cloud',
    accent: Colors.secondary,
  },
  {
    key: 'features',
    title: 'Everything You Need',
    description: 'Light meter, water calculator, detailed health reports, expert care guides, and more tools to help you succeed.',
    icon: 'Sparkles',
    accent: Colors.accent,
  },
  {
    key: 'ready',
    title: 'You\'re All Set!',
    description: 'Start your plant care journey today. Scan your first plant and discover the power of AI-driven gardening.',
    icon: 'CheckCircle2',
    accent: Colors.success,
  },
];
