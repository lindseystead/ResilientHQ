/**
 * Navigation Type Definitions
 *
 * Type-safe navigation parameters for React Navigation.
 * Ensures compile-time safety for all navigation operations.
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Root Navigator Param List
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabsParamList>;
};

/**
 * Auth Stack Param List
 */
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ResetPassword: undefined;
};

/**
 * App Tabs Param List
 */
export type AppTabsParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
  ProfileStack: NavigatorScreenParams<ProfileStackParamList>;
  CommunityStack: NavigatorScreenParams<CommunityStackParamList>;
};

/**
 * Home Stack Param List
 */
export type HomeStackParamList = {
  Home: undefined;
  Journal: { moodValue?: string; moodEmoji?: string } | undefined;
  MoodTracker: undefined;
  MoodLog: { moodValue?: string; moodEmoji?: string } | undefined;
  Chatbot: { privateSession?: boolean } | undefined;
  Advice: undefined;
  SelfCare: undefined;
};

/**
 * Community Stack Param List
 */
export type CommunityStackParamList = {
  Community: undefined;
};

/**
 * Settings Stack Param List
 */
export type SettingsStackParamList = {
  Settings: undefined;
  Help: undefined;
};

/**
 * Profile Stack Param List
 */
export type ProfileStackParamList = {
  Profile: undefined;
};

/**
 * Route names as constants for type-safe navigation
 */
export const ROUTE_NAMES = {
  // Auth
  Login: 'Login',
  Signup: 'Signup',
  ResetPassword: 'ResetPassword',

  // Tabs
  HomeStack: 'HomeStack',
  SettingsStack: 'SettingsStack',
  ProfileStack: 'ProfileStack',
  CommunityStack: 'CommunityStack',

  // Home Stack
  Home: 'Home',
  Journal: 'Journal',
  MoodTracker: 'MoodTracker',
  MoodLog: 'MoodLog',
  Chatbot: 'Chatbot',
  Advice: 'Advice',
  SelfCare: 'SelfCare',

  // Community Stack
  Community: 'Community',

  // Settings Stack
  Settings: 'Settings',
  Help: 'Help',

  // Profile Stack
  Profile: 'Profile',
} as const;
