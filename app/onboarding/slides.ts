import { Colors } from '@/constants/colors';

export type IconName =
  | 'Scan'
  | 'HeartPulse'
  | 'Sprout'
  | 'Droplets'
  | 'SunMedium'
  | 'ClipboardCheck'
  | 'BookOpen'
  | 'Cloud'
  | 'ShieldCheck'
  | 'Rocket';

export type OnboardingSlide = {
  key: string;
  title: string;
  description: string;
  icon: IconName;
  accent: string;
};

export const slides: OnboardingSlide[] = [
  {
    key: 'identify',
    title: 'Identify any plant in seconds',
    description: 'Capture a photo or upload an image to reveal species, confidence, and quick facts instantly.',
    icon: 'Scan',
    accent: Colors.primary,
  },
  {
    key: 'health-ai',
    title: 'Spot issues before they spread',
    description: 'AI-powered health analysis flags stress, pests, and nutrient gaps so you can act early.',
    icon: 'HeartPulse',
    accent: Colors.secondary,
  },
  {
    key: 'garden-library',
    title: 'Build your living plant library',
    description: 'Save identifications, notes, and photos to grow a personalised history for every plant you care for.',
    icon: 'Sprout',
    accent: Colors.accent,
  },
  {
    key: 'watering',
    title: 'Get watering guidance that adapts',
    description: 'Use the water calculator to tailor frequency to plant type, pot size, season, and environment.',
    icon: 'Droplets',
    accent: Colors.water,
  },
  {
    key: 'light',
    title: 'Measure the perfect light',
    description: 'Check light levels with the built-in meter and place each plant where it thrives best.',
    icon: 'SunMedium',
    accent: Colors.sun,
  },
  {
    key: 'reports',
    title: 'Deep-dive into health reports',
    description: 'Unlock detailed diagnostics, care priorities, and progress tracking for every plant in your collection.',
    icon: 'ClipboardCheck',
    accent: Colors.secondaryDark,
  },
  {
    key: 'tips',
    title: 'Learn with bite-sized care tips',
    description: 'Browse expert-backed advice and guided workflows in the help centre whenever you need a refresher.',
    icon: 'BookOpen',
    accent: Colors.accentDark,
  },
  {
    key: 'sync',
    title: 'Sync securely across devices',
    description: 'Sign in to keep your garden, identifications, and health records backed up and available everywhere.',
    icon: 'Cloud',
    accent: Colors.secondary,
  },
  {
    key: 'privacy',
    title: 'You stay in control of data',
    description: 'Manage analytics, exports, and onboarding anytime with privacy-first settings built for transparency.',
    icon: 'ShieldCheck',
    accent: Colors.primaryDark,
  },
  {
    key: 'cta',
    title: 'Ready to grow happier plants?',
    description: 'Let’s build your smartest garden companion together—your plants will thank you.',
    icon: 'Rocket',
    accent: Colors.leaf,
  },
];
