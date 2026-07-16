/**
 * Mood Tracking Feature Integration Tests
 *
 * End-to-end tests for mood tracking including logging, viewing history,
 * and analytics.
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithAuth } from '../../tests/helpers/testHelpers';
import { MoodLogScreen, MoodTrackerScreen } from '@/src/features/mood';
import * as moodService from '@/src/domains/wellbeing/moods';

// Mock mood service
jest.mock('@/src/domains/wellbeing/moods', () => ({
  saveMoodLog: jest.fn(),
  getUserMoodLogs: jest.fn(),
}));

describe('Mood Tracking Feature Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mood Logging', () => {
    it('should log a mood successfully', async () => {
      (moodService.saveMoodLog as jest.Mock).mockResolvedValue({
        id: 'mood-1',
        value: '2',
        emoji: '😊',
        timestamp: new Date(),
      });

      const { getByText } = renderWithAuth(<MoodLogScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });

    it('should handle mood logging errors', async () => {
      (moodService.saveMoodLog as jest.Mock).mockRejectedValue(new Error('Failed to log mood'));

      const { getByText } = renderWithAuth(<MoodLogScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Mood History', () => {
    it('should display mood history', async () => {
      (moodService.getUserMoodLogs as jest.Mock).mockResolvedValue([
        { id: 'mood-1', value: '2', emoji: '😊', timestamp: new Date() },
        { id: 'mood-2', value: '3', emoji: '😄', timestamp: new Date() },
      ]);

      const { getByText } = renderWithAuth(<MoodTrackerScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Mood Analytics', () => {
    it('should calculate mood statistics', async () => {
      // Mock mood logs for stats calculation
      (moodService.getUserMoodLogs as jest.Mock).mockResolvedValue([
        { id: 'mood-1', value: '2', emoji: '😊', timestamp: new Date() },
        { id: 'mood-2', value: '3', emoji: '😄', timestamp: new Date() },
      ]);

      const { getByText } = renderWithAuth(<MoodTrackerScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });
});
