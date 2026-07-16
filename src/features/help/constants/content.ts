/**
 * Help feature content and exercise data
 */

import { Ionicons } from '@expo/vector-icons';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TutorialStep {
  title: string;
  content: string;
}

export interface TutorialData {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  steps: TutorialStep[];
}

export const SUPPORT_EMAIL = 'support@resilienthq.com';

export const BREATHING_STEPS = [
  { text: 'Breathe in slowly...', duration: 4000 },
  { text: 'Hold...', duration: 4000 },
  { text: 'Breathe out slowly...', duration: 4000 },
  { text: 'Pause...', duration: 2000 },
];

export const GROUNDING_STEPS = [
  { count: 5, sense: 'see', text: 'Name 5 things you can see' },
  { count: 4, sense: 'touch', text: 'Name 4 things you can touch' },
  { count: 3, sense: 'hear', text: 'Name 3 things you can hear' },
  { count: 2, sense: 'smell', text: 'Name 2 things you can smell' },
  { count: 1, sense: 'taste', text: 'Name 1 thing you can taste' },
];

export const HELP_FAQS: FAQItem[] = [
  {
    question: 'What is ResilientHQ?',
    answer:
      'ResilientHQ is a comprehensive mental wellness platform designed to help you track your mood, practice self-care, connect with a supportive community, and access AI-powered mental health resources. Our goal is to provide you with tools and support to build resilience and improve your mental well-being.',
  },
  {
    question: 'How do I reset my password?',
    answer:
      'To reset your password, go to the Login screen and tap "Forgot Password?" below the password field. Enter your email address and we\'ll send you a password reset link. If you don\'t receive the email, check your spam folder or contact support.',
  },
  {
    question: 'How do I use the Mood Tracker?',
    answer:
      "The Mood Tracker allows you to log your daily emotional state. Navigate to the Mood Tracker from the Home screen, select how you're feeling, add any notes about your day, and save your entry. You can view your mood history over time to identify patterns and trends.",
  },
  {
    question: 'How do I use the Self-Care Section?',
    answer:
      'The Self-Care section provides curated activities and resources to help you practice self-care. Browse through different categories, try recommended exercises, and track your self-care activities. Regular use can help improve your overall mental wellness.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Your privacy matters. Your mood logs, journal entries, and account details are stored in your own private account and are not shared with other users. If AI features are enabled, messages you send to the assistant are processed by a third-party AI provider to generate replies. You can control your privacy settings in the Settings screen, including making your profile private, and you can export or delete your data at any time.',
  },
];

export const HELP_TUTORIALS: TutorialData[] = [
  {
    icon: 'book-outline',
    title: 'Getting Started Guide',
    description:
      'Learn the basics of using ResilientHQ and discover all the features available to support your mental wellness journey.',
    steps: [
      {
        title: '1. Log Your Mood Daily',
        content:
          'Tap "Mood Tracker" from the Home screen. Select an emoji that matches how you feel, then save. Tracking daily helps you spot patterns over time.',
      },
      {
        title: '2. Write in Your Journal',
        content:
          'Open the Journal from the Home screen. Use the prompts or write freely. The AI can help soften or expand your thoughts.',
      },
      {
        title: '3. Chat with AI Support',
        content:
          'The AI Chatbot offers mood-aware support, suggested prompts, and can save conversations as journal entries.',
      },
      {
        title: '4. Practice Self-Care',
        content:
          'Visit Self-Care for daily affirmations and practical tips. Small, consistent actions build resilience over time.',
      },
    ],
  },
  {
    icon: 'analytics-outline',
    title: 'Understanding Your Data',
    description:
      'Learn how to interpret your mood trends, journal entries, and self-care activity data to gain insights into your mental health.',
    steps: [
      {
        title: '1. Mood History',
        content:
          'View your mood over time in Mood History. Look for recurring patterns - which days tend to be harder? What helps on good days?',
      },
      {
        title: '2. Self-Care Score',
        content:
          'Your Profile shows a self-care score based on mood logs, journal entries, and streaks. Aim for consistency, not perfection.',
      },
      {
        title: '3. Resilience Level',
        content:
          'Your resilience level grows as you engage with the app. Levels range from "Getting Started" to "Thriving" - each step is progress.',
      },
    ],
  },
  {
    icon: 'people-outline',
    title: 'Community Features',
    description:
      'Discover how to connect with others, share experiences, and find support within the ResilientHQ community.',
    steps: [
      {
        title: '1. Browse Posts',
        content:
          'The Community tab shows posts from other members. Use category filters to find topics that resonate with you.',
      },
      {
        title: '2. Share Your Experience',
        content:
          'Tap the + button to create a post. Sharing your journey can help others and strengthen your own resilience.',
      },
      {
        title: '3. React and Comment',
        content:
          'Support others with reactions and comments. Building connections is a key part of mental wellness.',
      },
    ],
  },
];
