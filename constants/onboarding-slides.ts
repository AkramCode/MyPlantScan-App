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
    title: 'Your Plant Journey Starts Here',
    subtitle: 'Discover. Nurture. Thrive.',
    description: 'AI-powered tools to help you grow with confidence.',
    icon: 'Leaf',
    accent: Colors.primary,
  },
  {
    key: 'identify',
    title: 'Instant Plant Recognition',
    subtitle: 'Point, Snap, Know',
    description: 'Identify plants in seconds with precise AI recognition.',
    icon: 'Scan',
    accent: Colors.primary,
  },
  {
    key: 'experience',
    title: 'Your Experience Level',
    description: 'Help us personalize your care tips.',
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
    title: 'AI Health Diagnostics',
    subtitle: 'Spot problems before they spread',
    description: 'Instant health checks and early issue detection.',
    icon: 'HeartPulse',
    accent: Colors.primary,
  },
  {
    key: 'goals',
    title: 'Your Main Goal',
    description: 'What matters most to you?',
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
    title: 'Enable Camera Access',
    subtitle: 'Real-time plant analysis',
    description: 'Grant access to scan plants instantly.',
    icon: 'Camera',
    accent: Colors.primary,
    requiresPermission: 'camera',
    permissionTitle: 'Camera permission required',
    permissionDescription: 'Enable camera to scan and identify plants. Your photos stay private.',
  },
  {
    key: 'library-permission',
    title: 'Access Your Photo Library',
    subtitle: 'Import and analyze photos',
    description: 'Allow access to import existing plant photos.',
    icon: 'Image',
    accent: Colors.primary,
    requiresPermission: 'library',
    permissionTitle: 'Photo library access',
    permissionDescription: 'Allow access to analyze and track your plant photos.',
  },
  {
    key: 'garden',
    title: 'Your Digital Plant Library',
    subtitle: 'Organize and track everything',
    description: 'Catalog plants with notes and milestones.',
    icon: 'Library',
    accent: Colors.primary,
  },
  {
    key: 'notifications',
    title: 'Reminder Frequency',
    description: 'Choose your preferred schedule.',
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
    title: 'Secure Cloud Backup',
    subtitle: 'Never lose your data',
    description: 'Your garden is synced and backed up across devices.',
    icon: 'Cloud',
    accent: Colors.primary,
  },
  {
    key: 'ready',
    title: "You're All Set",
    subtitle: 'Start your plant journey',
    description: 'Scan your first plant to begin.',
    icon: 'CheckCircle2',
    accent: Colors.primary,
  },
];
