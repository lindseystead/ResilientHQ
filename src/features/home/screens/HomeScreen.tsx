/**
 * Home Screen
 *
 * Wellness dashboard.
 * Features personalized greeting, progress tracking, and quick actions.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import { BottomSheet, ProtectedScreen, Text } from '@/src/shared/ui';
import {
  AdaptiveResiliencePlanCard,
  AdaptiveResiliencePlanSheet,
  DailyCheckInCard,
  HomeFeatureGrid,
  HomeProgressCard,
  HomeQuickActions,
  HomeSettingsLink,
  PrivateSessionCard,
  ProfileAvatar,
  ResilienceCheckInSheet,
  ResilienceInsightsCard,
  ResilienceInsightsSheet,
} from '../components';
import {
  HOME_QUICK_ACTIONS,
  MOOD_METADATA,
  type DashboardFeatureItem,
} from '../constants/dashboard';
import { ROUTES } from '@/src/config/navigation';
import { FEATURES } from '@/src/config/constants';
import { useTraumaSafeMode } from '@/src/providers/TraumaSafeModeProvider';
import { useAuth, useErrorHandler, useTheme, useTypedNavigation } from '@/src/shared/hooks';
import { useHaptics } from '@/src/shared/hooks/haptics';
import {
  useAdaptiveResiliencePlanProgress,
  useDailyResilienceCheckIn,
  useResilienceInsights,
  useTodayCounts,
} from '../hooks';
import { useResponsive } from '@/src/shared/utils/responsive';
import {
  buildAdaptiveResiliencePlan,
  createInterventionSignalSnapshot,
  getAdaptiveResiliencePlanStepOrder,
  getTopInterventionOutcomeForUser,
  logInterventionEvent,
  personalizeAdaptiveResiliencePlan,
  saveMoodLog,
  saveResilienceCheckIn,
  type AdaptiveResiliencePlanFeedback,
  type InterventionOutcomeInsight,
  type ResilienceActionType,
  type ResilienceCheckInDraft,
} from '@/src/domains/wellbeing';

// ─── Home Screen ─────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { traumaSafeMode } = useTraumaSafeMode();
  const handleError = useErrorHandler();
  const { impact, notification } = useHaptics();
  const { scaleSpacing, insets } = useResponsive();
  const [showCheckInSheet, setShowCheckInSheet] = useState<boolean>(false);
  const [showPlanSheet, setShowPlanSheet] = useState<boolean>(false);
  const [showInsightsSheet, setShowInsightsSheet] = useState<boolean>(false);
  const [isSavingCheckIn, setIsSavingCheckIn] = useState<boolean>(false);
  const [topInterventionOutcome, setTopInterventionOutcome] =
    useState<InterventionOutcomeInsight | null>(null);
  const {
    moodLogsCount,
    journalEntriesCount,
    isLoading,
    refresh: refreshTodayCounts,
  } = useTodayCounts();
  const {
    checkIn: dailyCheckIn,
    latestMood,
    latestCheckIn,
    hasCompletedCheckInToday,
    isLoading: isCheckInLoading,
    refresh: refreshDailyCheckIn,
  } = useDailyResilienceCheckIn(moodLogsCount, journalEntriesCount);
  const {
    insights: resilienceInsights,
    entries: resilienceInsightEntries,
    isLoading: areInsightsLoading,
    refresh: refreshInsights,
  } = useResilienceInsights();
  const baseResiliencePlan = useMemo(
    () =>
      buildAdaptiveResiliencePlan({
        latestMood,
        latestCheckIn,
        recentEntries: resilienceInsightEntries,
        hasCompletedCheckInToday,
      }),
    [hasCompletedCheckInToday, latestCheckIn, latestMood, resilienceInsightEntries],
  );
  const {
    completedStepIndexes,
    helpfulnessByStep,
    completedCount,
    completionPercent,
    isLoading: isPlanProgressLoading,
    weekKey: planWeekKey,
    mostHelpfulStepIndex,
    mostHelpfulStepLabel,
    strongestHelpfulnessLabel,
    toggleStep,
    rateStep,
    reset: resetPlanProgress,
  } = useAdaptiveResiliencePlanProgress(baseResiliencePlan);
  useEffect(() => {
    const loadTopInterventionOutcome = async () => {
      if (!user) {
        setTopInterventionOutcome(null);
        return;
      }

      try {
        const outcome = await getTopInterventionOutcomeForUser(user.uid, resilienceInsightEntries);
        setTopInterventionOutcome(outcome);
      } catch {
        setTopInterventionOutcome(null);
      }
    };

    void loadTopInterventionOutcome();
  }, [resilienceInsightEntries, user]);
  const adaptivePlanFeedback = useMemo<AdaptiveResiliencePlanFeedback | null>(() => {
    if (topInterventionOutcome) {
      const stepIndex = baseResiliencePlan.steps.findIndex(
        (step) => step === topInterventionOutcome.label,
      );

      if (stepIndex >= 0) {
        return {
          stepIndex,
          stepLabel: topInterventionOutcome.label,
          helpfulnessLabel: topInterventionOutcome.summary,
        };
      }
    }

    if (mostHelpfulStepIndex !== null && mostHelpfulStepLabel && strongestHelpfulnessLabel) {
      return {
        stepIndex: mostHelpfulStepIndex,
        stepLabel: mostHelpfulStepLabel,
        helpfulnessLabel: strongestHelpfulnessLabel,
      };
    }

    return null;
  }, [
    baseResiliencePlan.steps,
    mostHelpfulStepIndex,
    mostHelpfulStepLabel,
    strongestHelpfulnessLabel,
    topInterventionOutcome,
  ]);
  const resiliencePlan = useMemo(
    () => personalizeAdaptiveResiliencePlan(baseResiliencePlan, adaptivePlanFeedback),
    [adaptivePlanFeedback, baseResiliencePlan],
  );
  const resiliencePlanStepOrder = useMemo(
    () => getAdaptiveResiliencePlanStepOrder(baseResiliencePlan, adaptivePlanFeedback),
    [adaptivePlanFeedback, baseResiliencePlan],
  );

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.displayName?.split(' ')[0] ?? null;
  const quickActions = useMemo(
    () =>
      HOME_QUICK_ACTIONS.filter(
        (action) => FEATURES.aiChatEnabled || action.route !== ROUTES.chatbot,
      ),
    [],
  );

  // Quick actions
  const features: DashboardFeatureItem[] = useMemo(
    () => [
      {
        id: 'selfcare',
        title: 'Self Care',
        subtitle: 'Activities & tips',
        icon: 'leaf-outline',
        route: ROUTES.selfCare,
        color: theme.colors.success,
      },
      {
        id: 'community',
        title: 'Community',
        subtitle: 'Connect',
        icon: 'people-outline',
        route: ROUTES.community,
        color: theme.colors.warning,
      },
      {
        id: 'advice',
        title: 'Advice',
        subtitle: 'Expert tips',
        icon: 'bulb-outline',
        route: ROUTES.advice,
        color: theme.colors.secondary,
      },
      {
        id: 'history',
        title: 'Mood History',
        subtitle: 'View patterns',
        icon: 'analytics-outline',
        route: ROUTES.moodLog,
        color: theme.colors.primary,
      },
    ],
    [theme.colors],
  );

  const handleNavigate = useCallback(
    (route: string) => {
      impact('light');
      const resolvedRoute =
        !FEATURES.aiChatEnabled && route === ROUTES.chatbot ? ROUTES.advice : route;
      navigation.push(resolvedRoute as (typeof ROUTES)[keyof typeof ROUTES]);
    },
    [impact, navigation],
  );

  const handleStartPrivateSession = useCallback(() => {
    impact('light');
    if (!FEATURES.aiChatEnabled) {
      navigation.push(ROUTES.advice);
      return;
    }
    navigation.push(ROUTES.chatbot, { privateSession: true });
  }, [impact, navigation]);

  const getCheckInRoute = useCallback((actionType: ResilienceActionType) => {
    switch (actionType) {
      case 'logMood':
        return ROUTES.moodTracker;
      case 'journal':
        return ROUTES.journal;
      case 'chat':
        return FEATURES.aiChatEnabled ? ROUTES.chatbot : ROUTES.advice;
      case 'advice':
      default:
        return ROUTES.advice;
    }
  }, []);

  const handleCloseCheckInSheet = useCallback(() => {
    setShowCheckInSheet(false);
  }, []);

  const handleClosePlanSheet = useCallback(() => {
    setShowPlanSheet(false);
  }, []);

  const handleCloseInsightsSheet = useCallback(() => {
    setShowInsightsSheet(false);
  }, []);

  const handleOpenDailyCheckIn = useCallback(() => {
    if (hasCompletedCheckInToday) {
      handleNavigate(getCheckInRoute(dailyCheckIn.primaryActionType));
      return;
    }

    setShowPlanSheet(false);
    setShowInsightsSheet(false);
    impact('light');
    setShowCheckInSheet(true);
  }, [
    dailyCheckIn.primaryActionType,
    getCheckInRoute,
    handleNavigate,
    hasCompletedCheckInToday,
    impact,
  ]);

  const handleOpenResilienceInsights = useCallback(() => {
    if (
      resilienceInsightEntries.length === 0 &&
      !hasCompletedCheckInToday &&
      resilienceInsights.primaryActionType === 'logMood'
    ) {
      handleOpenDailyCheckIn();
      return;
    }

    impact('light');
    setShowInsightsSheet(true);
  }, [
    handleOpenDailyCheckIn,
    hasCompletedCheckInToday,
    impact,
    resilienceInsightEntries.length,
    resilienceInsights.primaryActionType,
  ]);

  const handleFollowInsightsRecommendation = useCallback(() => {
    setShowInsightsSheet(false);
    handleNavigate(getCheckInRoute(resilienceInsights.primaryActionType));
  }, [getCheckInRoute, handleNavigate, resilienceInsights.primaryActionType]);

  const handleOpenResiliencePlan = useCallback(() => {
    impact('light');
    setShowPlanSheet(true);
  }, [impact]);

  const handleFollowPlanRecommendation = useCallback(() => {
    setShowPlanSheet(false);

    if (!hasCompletedCheckInToday && resiliencePlan.primaryActionType === 'logMood') {
      handleOpenDailyCheckIn();
      return;
    }

    handleNavigate(getCheckInRoute(resiliencePlan.primaryActionType));
  }, [
    getCheckInRoute,
    handleNavigate,
    handleOpenDailyCheckIn,
    hasCompletedCheckInToday,
    resiliencePlan.primaryActionType,
  ]);

  const handleTogglePlanStep = useCallback(
    async (index: number): Promise<void> => {
      const wasCompleted = completedStepIndexes.includes(index);
      const didUpdate = await toggleStep(index);

      if (didUpdate) {
        impact('light');

        if (!wasCompleted && user) {
          try {
            await logInterventionEvent(user.uid, {
              type: 'planStep',
              source: 'home',
              label: baseResiliencePlan.steps[index] ?? `Step ${index + 1}`,
              preSignals: createInterventionSignalSnapshot(latestCheckIn),
            });
          } catch (error) {
            handleError(error, {
              context: 'Logging resilience plan intervention',
              showAlert: false,
            });
          }
        }
      }
    },
    [
      baseResiliencePlan.steps,
      completedStepIndexes,
      handleError,
      impact,
      latestCheckIn,
      toggleStep,
      user,
    ],
  );

  const handleResetPlanProgress = useCallback(async (): Promise<void> => {
    const didReset = await resetPlanProgress();

    if (didReset) {
      void notification('success');
    }
  }, [notification, resetPlanProgress]);

  const handleRatePlanStep = useCallback(
    async (index: number, helpfulness: 1 | 2 | 3): Promise<void> => {
      const didSave = await rateStep(index, helpfulness);

      if (didSave) {
        impact('light');
      }
    },
    [impact, rateStep],
  );

  const handleSubmitDailyCheckIn = useCallback(
    async (draft: ResilienceCheckInDraft): Promise<void> => {
      if (!user) {
        return;
      }

      const normalizedMoodValue = Math.min(5, Math.max(1, Math.round(draft.moodValue)));
      const mood = MOOD_METADATA[normalizedMoodValue] ?? MOOD_METADATA[3];

      try {
        setIsSavingCheckIn(true);
        await Promise.all([
          saveResilienceCheckIn(user, { ...draft, moodValue: normalizedMoodValue }),
          saveMoodLog(user, normalizedMoodValue, mood.emoji, mood.label, draft.reflection),
        ]);

        setShowCheckInSheet(false);
        void notification('success');
        await Promise.all([refreshTodayCounts(), refreshDailyCheckIn(), refreshInsights()]);
      } catch (error) {
        handleError(error, { context: 'Saving daily resilience check-in' });
      } finally {
        setIsSavingCheckIn(false);
      }
    },
    [handleError, notification, refreshDailyCheckIn, refreshInsights, refreshTodayCounts, user],
  );

  // Progress calculation
  const totalToday = moodLogsCount + journalEntriesCount;
  const dailyGoal = 3;
  const progressPercent = Math.min((totalToday / dailyGoal) * 100, 100);
  const progressMessage =
    totalToday === 0
      ? traumaSafeMode
        ? 'You can begin with one small step.'
        : "Let's start your journey!"
      : totalToday >= dailyGoal
        ? traumaSafeMode
          ? 'You have done enough for today.'
          : 'Great job today! 🎉'
        : traumaSafeMode
          ? 'Steady progress counts.'
          : "Keep going, you're doing great!";

  return (
    <ProtectedScreen
      title="Home"
      requireAuth
      showHeader={false}
      scroll
      padding={0}
      safeAreaTop
      contentStyle={{ paddingTop: Math.max(insets.top, scaleSpacing(16)) }}
      includeTabBarPadding
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={[styles.container, { paddingHorizontal: scaleSpacing(16) }]}>
        {/* Header */}
        <Animated.View
          entering={traumaSafeMode ? undefined : FadeInDown.duration(400)}
          style={[styles.header, { marginBottom: scaleSpacing(24) }]}
        >
          <View style={styles.headerText}>
            <Text variant="caption" muted style={styles.greeting}>
              {greeting}
            </Text>
            <Text variant="h2" style={styles.name}>
              {firstName || 'Welcome'}
            </Text>
          </View>
          <ProfileAvatar
            photoURL={user?.photoURL}
            displayName={user?.displayName}
            size={scaleSpacing(48)}
          />
        </Animated.View>

        {/* Progress Card */}
        {!isLoading && (
          <HomeProgressCard
            totalToday={totalToday}
            dailyGoal={dailyGoal}
            progressPercent={progressPercent}
            progressMessage={progressMessage}
            traumaSafeMode={traumaSafeMode}
            disableAnimation={traumaSafeMode}
            onPress={() => handleNavigate(ROUTES.moodLog)}
          />
        )}

        {/* Daily Resilience Check-In */}
        {!isCheckInLoading && (
          <Animated.View entering={traumaSafeMode ? undefined : FadeInUp.duration(400).delay(80)}>
            <DailyCheckInCard checkIn={dailyCheckIn} onPress={handleOpenDailyCheckIn} />
          </Animated.View>
        )}

        {!isCheckInLoading && !areInsightsLoading && (
          <Animated.View entering={traumaSafeMode ? undefined : FadeInUp.duration(400).delay(110)}>
            <AdaptiveResiliencePlanCard
              plan={resiliencePlan}
              completedCount={completedCount}
              completionPercent={completionPercent}
              totalSteps={resiliencePlan.steps.length}
              mostHelpfulStepLabel={mostHelpfulStepLabel}
              strongestHelpfulnessLabel={strongestHelpfulnessLabel}
              outcomeInsight={topInterventionOutcome}
              stepOrder={resiliencePlanStepOrder}
              isLoading={isPlanProgressLoading}
              onPress={handleOpenResiliencePlan}
            />
          </Animated.View>
        )}

        {/* Weekly Resilience Insights */}
        {!areInsightsLoading && (
          <Animated.View entering={traumaSafeMode ? undefined : FadeInUp.duration(400).delay(90)}>
            <ResilienceInsightsCard
              insights={resilienceInsights}
              onPress={handleOpenResilienceInsights}
            />
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={traumaSafeMode ? undefined : FadeIn.duration(300).delay(100)}>
          <Text variant="h4" style={{ marginBottom: scaleSpacing(12) }}>
            {traumaSafeMode ? 'Steady Supports' : 'Quick Actions'}
          </Text>
        </Animated.View>

        <HomeQuickActions
          actions={quickActions}
          disableAnimation={traumaSafeMode}
          onPressAction={handleNavigate}
        />

        {FEATURES.aiChatEnabled ? (
          <PrivateSessionCard
            disableAnimation={traumaSafeMode}
            onPress={handleStartPrivateSession}
          />
        ) : null}

        {/* Explore Section */}
        <Animated.View entering={traumaSafeMode ? undefined : FadeIn.duration(300).delay(200)}>
          <Text variant="h4" style={{ marginBottom: scaleSpacing(12) }}>
            Explore
          </Text>
        </Animated.View>

        <HomeFeatureGrid
          features={features}
          disableAnimation={traumaSafeMode}
          onPressFeature={handleNavigate}
        />

        {/* Settings Link */}
        <HomeSettingsLink
          disableAnimation={traumaSafeMode}
          onPress={() => handleNavigate(ROUTES.settings)}
        />
      </View>
      <BottomSheet
        visible={showCheckInSheet}
        onClose={handleCloseCheckInSheet}
        title="Daily Check-In"
        snapPoints={['82%']}
      >
        <ResilienceCheckInSheet
          onSubmit={handleSubmitDailyCheckIn}
          onCancel={handleCloseCheckInSheet}
          isSaving={isSavingCheckIn}
          shouldReset={!showCheckInSheet}
        />
      </BottomSheet>
      <BottomSheet
        visible={showPlanSheet}
        onClose={handleClosePlanSheet}
        title="This Week's Plan"
        snapPoints={['88%']}
      >
        <AdaptiveResiliencePlanSheet
          plan={resiliencePlan}
          completedStepIndexes={completedStepIndexes}
          helpfulnessByStep={helpfulnessByStep}
          completionPercent={completionPercent}
          completedCount={completedCount}
          weekKey={planWeekKey}
          isLoading={isPlanProgressLoading}
          hasCompletedCheckInToday={hasCompletedCheckInToday}
          mostHelpfulStepLabel={mostHelpfulStepLabel}
          strongestHelpfulnessLabel={strongestHelpfulnessLabel}
          outcomeInsight={topInterventionOutcome}
          stepOrder={resiliencePlanStepOrder}
          onToggleStep={(index) => {
            void handleTogglePlanStep(index);
          }}
          onRateStep={(index, helpfulness) => {
            void handleRatePlanStep(index, helpfulness);
          }}
          onReset={() => {
            void handleResetPlanProgress();
          }}
          onPrimaryAction={handleFollowPlanRecommendation}
          onOpenDailyCheckIn={handleOpenDailyCheckIn}
        />
      </BottomSheet>
      <BottomSheet
        visible={showInsightsSheet}
        onClose={handleCloseInsightsSheet}
        title="Resilience Trends"
        snapPoints={['84%']}
      >
        <ResilienceInsightsSheet
          insights={resilienceInsights}
          entries={resilienceInsightEntries}
          outcomeInsight={topInterventionOutcome}
          hasCompletedCheckInToday={hasCompletedCheckInToday}
          onPrimaryAction={handleFollowInsightsRecommendation}
          onOpenDailyCheckIn={handleOpenDailyCheckIn}
        />
      </BottomSheet>
    </ProtectedScreen>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    marginTop: 4,
  },
});

export default HomeScreen;
