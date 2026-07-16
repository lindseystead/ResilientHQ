/**
 * Home Stack Navigator
 *
 * Contains all screens accessible from the Home tab.
 * Includes: Home, Journal, MoodTracker, MoodLog, Advice, SelfCare.
 * Chatbot is included only when explicitly enabled.
 */

import { FEATURES } from '@/src/config/constants';
import { AdviceScreen } from '@/src/features/advice';
import { ChatbotScreen } from '@/src/features/chatbot';
import { JournalScreen } from '@/src/features/journal';
import { MoodLogScreen, MoodTrackerScreen } from '@/src/features/mood';
import { HomeScreen } from '@/src/features/home';
import { SelfCareScreen } from '@/src/features/selfcare';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="MoodTracker" component={MoodTrackerScreen} />
      <Stack.Screen name="MoodLog" component={MoodLogScreen} />
      {FEATURES.aiChatEnabled ? <Stack.Screen name="Chatbot" component={ChatbotScreen} /> : null}
      <Stack.Screen name="Advice" component={AdviceScreen} />
      <Stack.Screen name="SelfCare" component={SelfCareScreen} />
    </Stack.Navigator>
  );
}
