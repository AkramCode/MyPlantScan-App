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

export type QuizOption = {
  id: string;
  text: string;
  emoji?: string;
};

export type OnboardingSlide = {
  key: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: IconName;
  variant?: 'welcome' | 'quiz';
  accent: string;
  requiresPermission?: 'camera' | 'library';
  permissionTitle?: string;
  permissionDescription?: string;
  quizOptions?: QuizOption[];
  quizQuestion?: string;
};

export const slides: OnboardingSlide[] = [
  {
    key: 'confidence',
    title: 'Start your plant journey',
    subtitle: 'Discover. Nurture. Thrive.',
    description: 'Grow with AI-guided care.',
    icon: 'Leaf',
    accent: Colors.primary,
  },
  {
    key: 'identify',
    title: 'Instant plant recognition',
    subtitle: 'Point • Snap • Know',
    description: 'Identify any plant in seconds.',
    icon: 'Scan',
    accent: Colors.primary,
  },
  {
    key: 'experience',
    title: 'Your experience',
    description: 'Help us tailor tips.',
    icon: 'Leaf',
    accent: Colors.primary,
    variant: 'quiz',
    quizQuestion: 'How would you describe yourself?',
    quizOptions: [
      { id: 'beginner', text: 'Just starting out', emoji: '' },
      { id: 'intermediate', text: 'Some experience', emoji: '' },
      { id: 'expert', text: 'Plant expert', emoji: '' }
    ]
  },
  {
    key: 'health',
    title: 'AI health checks',
    subtitle: 'Spot problems early',
    description: 'Find issues before they spread.',
    icon: 'HeartPulse',
    accent: Colors.primary,
  },
  {
    key: 'goals',
    title: 'Your goal',
    description: 'What matters most?',
    icon: 'Sparkles',
    accent: Colors.primary,
    variant: 'quiz',
    quizQuestion: 'What is your main focus?',
    quizOptions: [
      { id: 'aesthetic', text: 'Beautiful decor', emoji: '' },
      { id: 'wellness', text: 'Health & wellness', emoji: '' },
      { id: 'hobby', text: 'Gardening hobby', emoji: '' }
    ]
  },
  {
    key: 'camera-permission',
    title: 'Camera access Required',
    description: 'Enable camera to identify plants.',
    icon: 'Camera',
    accent: Colors.primary,
    requiresPermission: 'camera',
    permissionTitle: 'Camera access',
    permissionDescription: 'Needed to scan plants.',
  },
  {
    key: 'library-permission',
    title: 'Photo library access Required',
    description: 'To access photos for analysis.',
    icon: 'Image',
    accent: Colors.primary,
    requiresPermission: 'library',
    permissionTitle: 'Photo access',
    permissionDescription: 'Needed to import photos.',
  },
  {
    key: 'garden',
    title: 'Plant library',
    subtitle: 'Organize & track',
    description: 'Catalog with notes and milestones.',
    icon: 'Library',
    accent: Colors.primary,
  },
  {
    key: 'notifications',
    title: 'Reminders',
    description: 'Choose a schedule.',
    icon: 'CalendarCheck',
    accent: Colors.primary,
    variant: 'quiz',
    quizQuestion: 'How often should we remind you?',
    quizOptions: [
      { id: 'daily', text: 'Daily reminders', emoji: '' },
      { id: 'weekly', text: 'Weekly reminders', emoji: '' },
      { id: 'minimal', text: 'Only when needed', emoji: '' }
    ]
  },
  {
    key: 'sync',
    title: 'Cloud backup',
    subtitle: 'Never lose data',
    description: 'Synced across devices.',
    icon: 'Cloud',
    accent: Colors.primary,
  },
  {
    key: 'ready',
    title: 'All set',
    subtitle: 'Start your journey',
    description: 'Scan your first plant.',
    icon: 'CheckCircle2',
    accent: Colors.primary,
  },
];
