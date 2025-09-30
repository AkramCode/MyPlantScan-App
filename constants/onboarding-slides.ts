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
  variant?: 'welcome';
  accent: string;
  requiresPermission?: 'camera' | 'library';
  permissionTitle?: string;
  permissionDescription?: string;
};

export const slides: OnboardingSlide[] = [
  {
    key: 'confidence',
    title: 'Grow With Confidence',
    description: 'MyPlantScan becomes your AI co-pilot for healthier plants and effortless routines.',
    icon: 'Leaf',
    accent: Colors.primary,
  },
  {
    key: 'identify',
    title: 'Point. Scan. Know.',
    description: 'Instant plant identification built on industry-grade recognition tuned for home collections.',
    icon: 'Scan',
    accent: Colors.primary,
  },
  {
    key: 'health',
    title: 'Pro Diagnostics In Seconds',
    description: 'Surface early warnings for pests, disease, and stress so you can act before leaves decline.',
    icon: 'HeartPulse',
    accent: Colors.primary,
  },
  {
    key: 'camera-permission',
    title: 'Enable Camera Access',
    description: 'Allow camera access so we can capture every detail and deliver real-time identification.',
    icon: 'Camera',
    accent: Colors.primary,
    requiresPermission: 'camera',
    permissionTitle: 'Camera Access Required',
    permissionDescription: 'Grant camera access to scan plants instantly and unlock live analysis.',
  },
  {
    key: 'library-permission',
    title: 'Import From Your Gallery',
    description: 'Share photo library access to analyse saved shots, compare progress, and build history.',
    icon: 'Image',
    accent: Colors.primary,
    requiresPermission: 'library',
    permissionTitle: 'Photo Library Access',
    permissionDescription: 'Allow reading your gallery so you can import past plant photos and export reports.',
  },
  {
    key: 'garden',
    title: 'Build A Living Catalog',
    description: 'Organise every plant with tags, notes, and growth milestones in a single clean workspace.',
    icon: 'Library',
    accent: Colors.primary,
  },
  {
    key: 'care',
    title: 'Care That Adapts',
    description: 'Receive seasonal schedules and actionable reminders calibrated to your plant habits.',
    icon: 'CalendarCheck',
    accent: Colors.primary,
  },
  {
    key: 'sync',
    title: 'Everything Backed Up',
    description: 'Your garden stays synchronised and securely stored so data is ready on every device.',
    icon: 'Cloud',
    accent: Colors.primary,
  },
  {
    key: 'features',
    title: 'Tools For Every Grower',
    description: 'Use the light meter, watering insights, health reports, and expert guides built for clarity.',
    icon: 'Sparkles',
    accent: Colors.primary,
  },
  {
    key: 'ready',
    title: 'Start Scanning',
    description: 'Time to capture your first plant and let data-driven care remove the guesswork.',
    icon: 'CheckCircle2',
    accent: Colors.primary,
  },
];
