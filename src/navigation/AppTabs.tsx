/**
 * App Tabs Navigator
 *
 * Bottom tab navigator for main app sections.
 * Uses HapticTab and IconSymbol for consistent styling.
 */

import { HapticTab, IconSymbol } from '@/src/shared/ui';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import { Colors, font, spacing } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommunityStack } from './CommunityStack';
import { HomeStack } from './HomeStack';
import { ProfileStack } from './ProfileStack';
import { SettingsStack } from './SettingsStack';
import type { AppTabsParamList } from './types';

const Tabs = createBottomTabNavigator<AppTabsParamList>();

export function AppTabs() {
  const { mode } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_HEIGHT;

  // Type-safe mode access
  const themeMode: 'light' | 'dark' = mode === 'light' ? 'light' : 'dark';
  const themeColors = Colors[themeMode];

  return (
    <Tabs.Navigator
      initialRouteName="HomeStack"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: false, // Keep tab bar visible even when keyboard is open

        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.tabIconDefault,

        tabBarButton: HapticTab,

        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopWidth: 1,
          borderTopColor: themeColors.border2,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          paddingTop: spacing.sm,
          height: tabBarHeight + Math.max(insets.bottom, spacing.sm),
          display: 'flex', // Ensure tab bar is always visible

          ...(Platform.OS === 'ios'
            ? {
                shadowColor: themeColors.black,
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: spacing.sm,
              }
            : {
                elevation: 8,
              }),
        },

        tabBarLabelStyle: {
          fontSize: font.caption,
          fontWeight: '500',
        },

        tabBarIconStyle: {
          marginTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="gear" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileStack"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="CommunityStack"
        component={CommunityStack}
        options={{
          title: 'Community',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={24} name="person.3.fill" color={color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}
