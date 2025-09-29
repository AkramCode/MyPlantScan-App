import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Linking,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  ExternalLink,
  Camera,
  Leaf,
  Droplets,
  Sun,
  Heart,
  Settings,
  Users,
  Lightbulb,
  AlertTriangle
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface TutorialItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: string[];
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How accurate is the plant identification?',
    answer: 'Our AI-powered plant identification uses Google Gemini 2.5 Flash and has an accuracy rate of over 95% for common plants. The accuracy depends on image quality, lighting conditions, and how clearly the plant features are visible.',
    category: 'Plant Identification',
    tags: ['accuracy', 'ai', 'identification', 'gemini']
  },
  {
    id: '2',
    question: 'What makes a good photo for plant identification?',
    answer: 'For best results: 1) Take photos in good natural light, 2) Include leaves, flowers, or distinctive features, 3) Fill the frame with the plant, 4) Avoid blurry or dark images, 5) Take multiple angles if possible.',
    category: 'Photography Tips',
    tags: ['photo', 'camera', 'lighting', 'tips']
  },
  {
    id: '3',
    question: 'How does the plant health analysis work?',
    answer: 'Our health analysis examines visual symptoms like leaf discoloration, spots, wilting, or pest damage. The AI compares these against a database of plant diseases and conditions to provide diagnosis and treatment recommendations.',
    category: 'Health Analysis',
    tags: ['health', 'diagnosis', 'disease', 'analysis']
  },
  {
    id: '4',
    question: 'Can I use the app offline?',
    answer: 'Basic app navigation works offline, but plant identification and health analysis require an internet connection to access our AI services. Your saved plants and garden data are stored locally and sync when connected.',
    category: 'Technical',
    tags: ['offline', 'internet', 'sync', 'data']
  },
  {
    id: '5',
    question: 'How do I add plants to my garden?',
    answer: 'After identifying a plant, tap "Add to Garden" on the results screen. You can also manually add plants by going to the Garden tab and tapping the "+" button. Fill in the plant details and care preferences.',
    category: 'Garden Management',
    tags: ['garden', 'add plants', 'management']
  },
  {
    id: '6',
    question: 'What is the water calculator?',
    answer: 'The water calculator helps determine optimal watering schedules based on plant type, pot size, soil type, humidity, and temperature. It provides personalized watering recommendations to prevent over or under-watering.',
    category: 'Plant Care Tools',
    tags: ['water', 'calculator', 'watering', 'schedule']
  },
  {
    id: '7',
    question: 'How does the light meter work?',
    answer: 'The light meter uses your device\'s camera to measure ambient light levels. Point it at your plant\'s location to get readings in lux, helping you determine if the spot provides adequate light for your plant\'s needs.',
    category: 'Plant Care Tools',
    tags: ['light', 'meter', 'lux', 'measurement']
  },
  {
    id: '8',
    question: 'Is my data secure and private?',
    answer: 'Yes, we take privacy seriously. Your photos and data are encrypted during transmission and storage. We don\'t share personal information with third parties. You can delete your data anytime from the settings.',
    category: 'Privacy & Security',
    tags: ['privacy', 'security', 'data', 'encryption']
  },
  {
    id: '9',
    question: 'How do I create an account?',
    answer: 'Tap "Sign In" on the More tab, then "Create Account". You can sign up with email or use social login options. An account lets you sync data across devices and access premium features.',
    category: 'Account',
    tags: ['account', 'signup', 'login', 'sync']
  },
  {
    id: '10',
    question: 'Why are some features not working?',
    answer: 'Common issues: 1) Check internet connection, 2) Update the app to latest version, 3) Restart the app, 4) Clear app cache, 5) Ensure camera permissions are granted. Contact support if problems persist.',
    category: 'Troubleshooting',
    tags: ['troubleshooting', 'bugs', 'issues', 'support']
  }
];

const tutorials: TutorialItem[] = [
  {
    id: '1',
    title: 'Taking Perfect Plant Photos',
    description: 'Learn how to capture the best photos for accurate plant identification',
    icon: <Camera size={24} color={Colors.primary} />,
    category: 'Photography',
    steps: [
      'Find good natural lighting - avoid direct sunlight or deep shadows',
      'Clean the camera lens for crisp, clear images',
      'Get close to the plant to fill the frame with important details',
      'Focus on distinctive features like leaves, flowers, bark, or fruit',
      'Take multiple shots from different angles',
      'Ensure the image is sharp and not blurry',
      'Include a size reference if the plant is very small or large'
    ]
  },
  {
    id: '2',
    title: 'Understanding Plant Health Diagnosis',
    description: 'Learn to interpret health analysis results and take appropriate action',
    icon: <Heart size={24} color={Colors.primary} />,
    category: 'Health Care',
    steps: [
      'Take clear photos of affected plant parts (leaves, stems, roots)',
      'Review the diagnosis results and confidence level',
      'Read the detailed symptoms description',
      'Follow the recommended treatment steps in order',
      'Monitor the plant\'s response to treatment',
      'Take follow-up photos to track improvement',
      'Consult a local expert for severe or persistent issues'
    ]
  },
  {
    id: '3',
    title: 'Managing Your Plant Garden',
    description: 'Organize and track your plants effectively',
    icon: <Leaf size={24} color={Colors.primary} />,
    category: 'Garden Management',
    steps: [
      'Add plants to your garden after identification',
      'Set up care reminders for watering and fertilizing',
      'Use the notes feature to track plant progress',
      'Take regular photos to document growth',
      'Update plant information as they mature',
      'Group plants by location or care requirements',
      'Export your garden data for backup'
    ]
  },
  {
    id: '4',
    title: 'Using the Water Calculator',
    description: 'Calculate optimal watering schedules for your plants',
    icon: <Droplets size={24} color={Colors.primary} />,
    category: 'Care Tools',
    steps: [
      'Select your plant type from the database',
      'Enter pot size and drainage information',
      'Specify soil type (potting mix, clay, sandy, etc.)',
      'Input current temperature and humidity levels',
      'Review the calculated watering schedule',
      'Set up reminders based on recommendations',
      'Adjust schedule based on seasonal changes'
    ]
  },
  {
    id: '5',
    title: 'Measuring Light Levels',
    description: 'Use the light meter to find the perfect spot for your plants',
    icon: <Sun size={24} color={Colors.primary} />,
    category: 'Care Tools',
    steps: [
      'Open the Light Meter tool from the More tab',
      'Point your device camera at the plant location',
      'Take readings at different times of day',
      'Compare readings with your plant\'s light requirements',
      'Move plants to locations with appropriate light levels',
      'Monitor seasonal changes in light availability',
      'Use artificial lighting if natural light is insufficient'
    ]
  }
];

const categories = ['All', 'Plant Identification', 'Photography Tips', 'Health Analysis', 'Garden Management', 'Plant Care Tools', 'Technical', 'Privacy & Security', 'Account', 'Troubleshooting'];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'faq' | 'tutorials' | 'contact'>('faq');
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({});

  const filteredFAQs = useMemo(() => {
    let filtered = faqData;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const toggleFAQ = (id: string) => {
    const newExpanded = new Set(expandedFAQ);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFAQ(newExpanded);
  };



  const handleEmailPress = async (email: string) => {
    const loadingKey = `email_${email}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      const emailUrl = `mailto:${email}`;
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(
          'Contact',
          `Please email us at: ${email}`,
          [
            {
              text: 'Copy Email',
              onPress: async () => {
                if (Platform.OS === 'web' && navigator.clipboard) {
                  await navigator.clipboard.writeText(email);
                  Alert.alert('Copied!', 'Email address copied to clipboard.');
                }
              }
            },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Contact', `Please email us at: ${email}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };



  const renderFAQTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.gray500}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.categoryButtonTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ List */}
      <View style={styles.faqContainer}>
        {filteredFAQs.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <HelpCircle size={48} color={Colors.gray400} />
            <Text style={styles.noResultsText}>No help topics found</Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your search or browse different categories
            </Text>
          </View>
        ) : (
          filteredFAQs.map((item) => (
            <View key={item.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFAQ(item.id)}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                {expandedFAQ.has(item.id) ? (
                  <ChevronUp size={20} color={Colors.gray500} />
                ) : (
                  <ChevronDown size={20} color={Colors.gray500} />
                )}
              </TouchableOpacity>
              {expandedFAQ.has(item.id) && (
                <View style={styles.faqContent}>
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                  <View style={styles.faqCategory}>
                    <Text style={styles.faqCategoryText}>{item.category}</Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderTutorialsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tutorialsContainer}>
        {tutorials.map((tutorial) => (
          <View key={tutorial.id} style={styles.tutorialCard}>
            <View style={styles.tutorialHeader}>
              <View style={styles.tutorialIcon}>
                {tutorial.icon}
              </View>
              <View style={styles.tutorialInfo}>
                <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
                <View style={styles.tutorialCategoryBadge}>
                  <Text style={styles.tutorialCategoryText}>{tutorial.category}</Text>
                </View>
              </View>
            </View>
            <View style={styles.tutorialSteps}>
              {tutorial.steps.map((step, index) => (
                <View key={index} style={styles.tutorialStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderContactTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.contactContainer}>
        {/* Contact Methods */}
        <View style={styles.contactSection}>
          <Text style={styles.contactSectionTitle}>Get in Touch</Text>
          <Text style={styles.contactSectionDescription}>
            Need help? Our support team is here to assist you with any questions or issues.
          </Text>

          <TouchableOpacity
            style={styles.contactMethod}
            onPress={() => handleEmailPress('support@myplantscan.com')}
            disabled={loadingStates['email_support@myplantscan.com']}
          >
            <View style={styles.contactMethodIcon}>
              <Mail size={24} color={Colors.primary} />
            </View>
            <View style={styles.contactMethodInfo}>
              <Text style={styles.contactMethodTitle}>Email Support</Text>
              <Text style={styles.contactMethodDescription}>support@myplantscan.com</Text>
              <Text style={styles.contactMethodNote}>Response within 24 hours</Text>
            </View>
            {loadingStates['email_support@myplantscan.com'] ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <ExternalLink size={16} color={Colors.gray500} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactMethod}
            onPress={() => Alert.alert('Live Chat', 'Live chat support is coming soon! For now, please use email support below.')}
          >
            <View style={styles.contactMethodIcon}>
              <MessageCircle size={24} color={Colors.primary} />
            </View>
            <View style={styles.contactMethodInfo}>
              <Text style={styles.contactMethodTitle}>Live Chat</Text>
              <Text style={styles.contactMethodDescription}>Real-time assistance</Text>
              <Text style={styles.contactMethodNote}>Coming Soon</Text>
            </View>
            <ExternalLink size={16} color={Colors.gray500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactMethod}
            onPress={() => Alert.alert('Community Forum', 'Community forum is coming soon! Join our growing community of plant enthusiasts.')}
          >
            <View style={styles.contactMethodIcon}>
              <Users size={24} color={Colors.primary} />
            </View>
            <View style={styles.contactMethodInfo}>
              <Text style={styles.contactMethodTitle}>Community Forum</Text>
              <Text style={styles.contactMethodDescription}>Connect with other plant enthusiasts</Text>
              <Text style={styles.contactMethodNote}>Coming Soon</Text>
            </View>
            <ExternalLink size={16} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.contactSection}>
          <Text style={styles.contactSectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => handleEmailPress('bug-report@myplantscan.com')}
            disabled={loadingStates['email_bug-report@myplantscan.com']}
          >
            <AlertTriangle size={20} color={Colors.warning} />
            <Text style={styles.quickActionText}>Report a Bug</Text>
            {loadingStates['email_bug-report@myplantscan.com'] && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => handleEmailPress('feedback@myplantscan.com')}
            disabled={loadingStates['email_feedback@myplantscan.com']}
          >
            <Lightbulb size={20} color={Colors.info} />
            <Text style={styles.quickActionText}>Send Feedback</Text>
            {loadingStates['email_feedback@myplantscan.com'] && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => handleEmailPress('feature-request@myplantscan.com')}
            disabled={loadingStates['email_feature-request@myplantscan.com']}
          >
            <Settings size={20} color={Colors.success} />
            <Text style={styles.quickActionText}>Request Feature</Text>
            {loadingStates['email_feature-request@myplantscan.com'] && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactSectionTitle}>App Information</Text>
          <View style={styles.appInfoCard}>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Version:</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Platform:</Text>
              <Text style={styles.appInfoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
            </View>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Build:</Text>
              <Text style={styles.appInfoValue}>2024.12.01</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Tips</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'faq' && styles.tabButtonActive]}
          onPress={() => setActiveTab('faq')}
        >
          <HelpCircle size={20} color={activeTab === 'faq' ? Colors.primary : Colors.gray500} />
          <Text style={[styles.tabButtonText, activeTab === 'faq' && styles.tabButtonTextActive]}>
            FAQ
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tutorials' && styles.tabButtonActive]}
          onPress={() => setActiveTab('tutorials')}
        >
          <BookOpen size={20} color={activeTab === 'tutorials' ? Colors.primary : Colors.gray500} />
          <Text style={[styles.tabButtonText, activeTab === 'tutorials' && styles.tabButtonTextActive]}>
            Tutorials
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'contact' && styles.tabButtonActive]}
          onPress={() => setActiveTab('contact')}
        >
          <MessageCircle size={20} color={activeTab === 'contact' ? Colors.primary : Colors.gray500} />
          <Text style={[styles.tabButtonText, activeTab === 'contact' && styles.tabButtonTextActive]}>
            Contact
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'faq' && renderFAQTab()}
      {activeTab === 'tutorials' && renderTutorialsTab()}
      {activeTab === 'contact' && renderContactTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray500,
    marginLeft: 8,
  },
  tabButtonTextActive: {
    color: Colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  categoryContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  faqContainer: {
    flex: 1,
    padding: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  faqItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  faqCategory: {
    alignSelf: 'flex-start',
  },
  faqCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tutorialsContainer: {
    padding: 16,
  },
  tutorialCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  tutorialHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tutorialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tutorialDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tutorialCategoryBadge: {
    alignSelf: 'flex-start',
  },
  tutorialCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tutorialSteps: {
    marginTop: 8,
  },
  tutorialStep: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  contactContainer: {
    padding: 16,
  },
  contactSection: {
    marginBottom: 32,
  },
  contactSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  contactSectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  contactMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactMethodInfo: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  contactMethodDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  contactMethodNote: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  appInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  appInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});