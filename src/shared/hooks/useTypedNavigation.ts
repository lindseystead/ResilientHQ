/**
 * App Navigation Hook
 *
 * Centralizes route-aware navigation for the app's supported screens.
 * Keeps route names and params consistent at the call site while hiding
 * the nested navigator details from feature code.
 */

import { ROUTES } from '@/src/config/navigation';
import { FEATURES } from '@/src/config/constants';
import type {
  AuthStackParamList,
  CommunityStackParamList,
  HomeStackParamList,
  ProfileStackParamList,
  SettingsStackParamList,
} from '@/src/navigation/types';
import {
  CommonActions,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';

/**
 * Route parameter types for screens that accept params
 */
export type JournalParams = {
  moodValue?: string;
  moodEmoji?: string;
};

export type MoodLogParams = {
  moodValue?: string;
  moodEmoji?: string;
};

export type ChatbotParams = {
  privateSession?: boolean;
};

type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

type RouteParamMap = {
  [ROUTES.login]: undefined;
  [ROUTES.signup]: undefined;
  [ROUTES.resetPassword]: undefined;
  [ROUTES.home]: undefined;
  [ROUTES.community]: undefined;
  [ROUTES.profile]: undefined;
  [ROUTES.settings]: undefined;
  [ROUTES.selfCare]: undefined;
  [ROUTES.journal]: JournalParams | undefined;
  [ROUTES.moodTracker]: undefined;
  [ROUTES.moodLog]: MoodLogParams | undefined;
  [ROUTES.chatbot]: ChatbotParams | undefined;
  [ROUTES.advice]: undefined;
  [ROUTES.help]: undefined;
};

type ParamsArg<RouteName extends AppRoute> = undefined extends RouteParamMap[RouteName]
  ? [params?: RouteParamMap[RouteName]]
  : [params: RouteParamMap[RouteName]];

type NestedDestination = {
  screen: string;
  params?: unknown;
};

type RootDestination = {
  name: 'Auth' | 'App';
  params: NestedDestination;
};

/**
 * Typed navigation methods
 */
export interface TypedNavigation {
  /**
   * Navigate to a route with optional parameters
   */
  push: <RouteName extends AppRoute>(route: RouteName, ...params: ParamsArg<RouteName>) => void;

  /**
   * Replace the current app navigation state with a new destination
   */
  replace: <RouteName extends AppRoute>(route: RouteName, ...params: ParamsArg<RouteName>) => void;

  /**
   * Go back to previous screen
   */
  back: () => void;
}

/**
 * useTypedNavigation Hook
 *
 * Provides route-safe navigation methods for supported app destinations.
 * `replace()` resets the root navigation tree to avoid stacking duplicate flows
 * across nested navigators.
 *
 * @example
 * ```tsx
 * const navigation = useTypedNavigation();
 * navigation.push(ROUTES.journal, { moodValue: '2', moodEmoji: '😊' });
 * ```
 */
export const useTypedNavigation = (): TypedNavigation => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const withNestedParams = <RouteName extends string, Params>(
    screen: RouteName,
    params?: Params,
  ): NestedDestination => (params === undefined ? { screen } : { screen, params });

  const toAuthDestination = <RouteName extends keyof AuthStackParamList>(
    screen: RouteName,
  ): RootDestination => ({
    name: 'Auth',
    params: withNestedParams(screen),
  });

  const toHomeDestination = <RouteName extends keyof HomeStackParamList>(
    screen: RouteName,
    params?: HomeStackParamList[RouteName],
  ): RootDestination => ({
    name: 'App',
    params: withNestedParams('HomeStack', withNestedParams(screen, params)),
  });

  const toSettingsDestination = <RouteName extends keyof SettingsStackParamList>(
    screen: RouteName,
  ): RootDestination => ({
    name: 'App',
    params: withNestedParams('SettingsStack', withNestedParams(screen)),
  });

  const toProfileDestination = <RouteName extends keyof ProfileStackParamList>(
    screen: RouteName,
  ): RootDestination => ({
    name: 'App',
    params: withNestedParams('ProfileStack', withNestedParams(screen)),
  });

  const toCommunityDestination = <RouteName extends keyof CommunityStackParamList>(
    screen: RouteName,
  ): RootDestination => ({
    name: 'App',
    params: withNestedParams('CommunityStack', withNestedParams(screen)),
  });

  const resolveDestination = <RouteName extends AppRoute>(
    route: RouteName,
    params?: RouteParamMap[RouteName],
  ): RootDestination => {
    switch (route) {
      case ROUTES.login:
        return toAuthDestination('Login');
      case ROUTES.signup:
        return toAuthDestination('Signup');
      case ROUTES.resetPassword:
        return toAuthDestination('ResetPassword');
      case ROUTES.home:
        return toHomeDestination('Home');
      case ROUTES.journal:
        return toHomeDestination('Journal', params as HomeStackParamList['Journal']);
      case ROUTES.moodTracker:
        return toHomeDestination('MoodTracker');
      case ROUTES.moodLog:
        return toHomeDestination('MoodLog', params as HomeStackParamList['MoodLog']);
      case ROUTES.chatbot:
        return FEATURES.aiChatEnabled
          ? toHomeDestination('Chatbot', params as HomeStackParamList['Chatbot'])
          : toHomeDestination('Advice');
      case ROUTES.advice:
        return toHomeDestination('Advice');
      case ROUTES.selfCare:
        return toHomeDestination('SelfCare');
      case ROUTES.community:
        return toCommunityDestination('Community');
      case ROUTES.profile:
        return toProfileDestination('Profile');
      case ROUTES.settings:
        return toSettingsDestination('Settings');
      case ROUTES.help:
        return toSettingsDestination('Help');
      default: {
        const exhaustiveCheck: never = route;
        throw new Error(`Unsupported route: ${exhaustiveCheck}`);
      }
    }
  };

  const push = <RouteName extends AppRoute>(route: RouteName, ...params: ParamsArg<RouteName>) => {
    const destination = resolveDestination(route, params[0]);
    navigation.dispatch(CommonActions.navigate(destination));
  };

  const replace = <RouteName extends AppRoute>(
    route: RouteName,
    ...params: ParamsArg<RouteName>
  ) => {
    const destination = resolveDestination(route, params[0]);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [destination],
      }),
    );
  };

  const back = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return {
    push,
    replace,
    back,
  };
};
