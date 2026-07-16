/**
 * Community Stack Navigator
 *
 * Contains screens for the Community tab.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CommunityStackParamList } from './types';
import { CommunityScreen } from '@/src/features/community';

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Community" component={CommunityScreen} />
    </Stack.Navigator>
  );
}
