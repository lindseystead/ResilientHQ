/**
 * Settings Stack Navigator
 *
 * Contains screens for the Settings tab.
 * Includes: Settings, Help (optional)
 */

import { HelpScreen } from '@/src/features/help';
import { SettingsScreen } from '@/src/features/settings';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
    </Stack.Navigator>
  );
}
