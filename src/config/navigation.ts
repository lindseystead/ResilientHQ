/**
 * Navigation Route Constants
 *
 * Centralized route name constants for type-safe navigation.
 * Prevents typos and makes refactoring easier.
 * Uses React Navigation route names.
 * All navigation must use these constants - NO inline strings allowed.
 */

import { ROUTE_NAMES } from '@/src/navigation/types';

export const ROUTES = {
  // Auth
  login: ROUTE_NAMES.Login,
  signup: ROUTE_NAMES.Signup,
  resetPassword: ROUTE_NAMES.ResetPassword,

  // Main tabs
  home: ROUTE_NAMES.Home,
  community: ROUTE_NAMES.Community,
  profile: ROUTE_NAMES.Profile,
  settings: ROUTE_NAMES.Settings,

  // Self Care (accessible from home, not a bottom tab)
  selfCare: ROUTE_NAMES.SelfCare,

  // Home stack screens
  journal: ROUTE_NAMES.Journal,
  moodTracker: ROUTE_NAMES.MoodTracker,
  moodLog: ROUTE_NAMES.MoodLog,
  chatbot: ROUTE_NAMES.Chatbot,
  advice: ROUTE_NAMES.Advice,

  // Settings stack screens
  help: ROUTE_NAMES.Help,
} as const;

/**
 * Route Type
 */
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
