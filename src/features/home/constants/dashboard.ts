import { ROUTES } from '@/src/config/navigation';

export interface DashboardQuickAction {
  id: string;
  label: string;
  description: string;
  icon: 'heart-outline' | 'book-outline' | 'chatbubbles-outline';
  route: string;
  gradientToken: 'gradientSecondary' | 'gradientPrimary' | 'gradientAccent';
}

export interface DashboardFeatureItem {
  id: string;
  title: string;
  subtitle: string;
  icon: 'leaf-outline' | 'people-outline' | 'bulb-outline' | 'analytics-outline';
  route: string;
  color: string;
}

export const MOOD_METADATA: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😞', label: 'Low' },
  2: { emoji: '😕', label: 'Strained' },
  3: { emoji: '😐', label: 'Steady' },
  4: { emoji: '🙂', label: 'Good' },
  5: { emoji: '😄', label: 'Strong' },
};

export const HOME_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: 'mood',
    label: 'Log Mood',
    description: 'Track how you feel',
    icon: 'heart-outline',
    route: ROUTES.moodTracker,
    gradientToken: 'gradientSecondary',
  },
  {
    id: 'journal',
    label: 'Journal',
    description: 'Write thoughts',
    icon: 'book-outline',
    route: ROUTES.journal,
    gradientToken: 'gradientPrimary',
  },
  {
    id: 'chat',
    label: 'AI Chat',
    description: 'Talk with Aria',
    icon: 'chatbubbles-outline',
    route: ROUTES.chatbot,
    gradientToken: 'gradientAccent',
  },
];
