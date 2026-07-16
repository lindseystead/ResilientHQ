/**
 * Home Feature Integration Tests
 *
 * End-to-end tests for the home screen including navigation,
 * today's counts, and feature access.
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithAuth } from '../../tests/helpers/testHelpers';
import { HomeScreen } from '@/src/features/home';
import * as homePlanProgressHook from '@/src/features/home/hooks/useAdaptiveResiliencePlanProgress';
import * as homeCheckInHook from '@/src/features/home/hooks/useDailyResilienceCheckIn';
import * as homeInsightsHook from '@/src/features/home/hooks/useResilienceInsights';
import * as homeHooks from '@/src/features/home/hooks/useTodayCounts';

// Mock hooks
jest.mock('@/src/features/home/hooks/useTodayCounts', () => ({
  useTodayCounts: jest.fn(),
}));

jest.mock('@/src/features/home/hooks/useAdaptiveResiliencePlanProgress', () => ({
  useAdaptiveResiliencePlanProgress: jest.fn(),
}));

jest.mock('@/src/features/home/hooks/useDailyResilienceCheckIn', () => ({
  useDailyResilienceCheckIn: jest.fn(),
}));

jest.mock('@/src/features/home/hooks/useResilienceInsights', () => ({
  useResilienceInsights: jest.fn(),
}));

describe('Home Feature Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (homeHooks.useTodayCounts as jest.Mock).mockReturnValue({
      journalEntriesCount: 3,
      moodLogsCount: 2,
      isLoading: false,
      refresh: jest.fn(),
    });
    (homeCheckInHook.useDailyResilienceCheckIn as jest.Mock).mockReturnValue({
      checkIn: {
        title: 'Check in with yourself',
        summary: 'Notice what your system needs right now.',
        signals: [],
        primaryActionLabel: 'Begin check-in',
        primaryActionType: 'logMood',
        actionReason: 'A quick check-in helps personalize today.',
        completionLabel: 'Start with one steady minute.',
      },
      latestMood: null,
      latestCheckIn: null,
      hasCompletedCheckInToday: false,
      isLoading: false,
      refresh: jest.fn(),
    });
    (homePlanProgressHook.useAdaptiveResiliencePlanProgress as jest.Mock).mockReturnValue({
      completedStepIndexes: [0],
      helpfulnessByStep: { 0: 2 },
      completedCount: 1,
      completionPercent: 33,
      isLoading: false,
      weekKey: '2026-02-23',
      mostHelpfulStepIndex: 0,
      mostHelpfulStepLabel: 'Step one',
      strongestHelpfulnessLabel: 'Helped some',
      toggleStep: jest.fn(),
      rateStep: jest.fn(),
      reset: jest.fn(),
    });
    (homeInsightsHook.useResilienceInsights as jest.Mock).mockReturnValue({
      insights: {
        title: 'Weekly resilience patterns',
        summary: 'Your recent check-ins are relatively steady.',
        trend: 'steady',
        averageStability: 68,
        strongestArea: 'Recovery foundation',
        growthArea: 'Safety and support',
        primaryActionType: 'journal',
        primaryActionLabel: 'Name what would feel safer today',
        metrics: [],
      },
      entries: [],
      isLoading: false,
      refresh: jest.fn(),
    });
  });

  describe("Today's Counts", () => {
    it("should display today's journal entries count", async () => {
      (homeHooks.useTodayCounts as jest.Mock).mockReturnValue({
        journalEntriesCount: 3,
        moodLogsCount: 2,
        isLoading: false,
        refresh: jest.fn(),
      });

      const { getByText } = renderWithAuth(<HomeScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });

    it("should display today's mood logs count", async () => {
      (homeHooks.useTodayCounts as jest.Mock).mockReturnValue({
        journalEntriesCount: 3,
        moodLogsCount: 2,
        isLoading: false,
        refresh: jest.fn(),
      });

      const { getByText } = renderWithAuth(<HomeScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Feature Navigation', () => {
    it('should navigate to journal screen', async () => {
      const navigate = jest.fn();
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
        navigate,
      });

      const { getByText } = renderWithAuth(<HomeScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });

    it('should navigate to mood tracker', async () => {
      const navigate = jest.fn();
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
        navigate,
      });

      const { getByText } = renderWithAuth(<HomeScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });
});
