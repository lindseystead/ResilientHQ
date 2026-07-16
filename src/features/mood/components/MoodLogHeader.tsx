/**
 * Mood Log Header Component
 *
 * Header section for MoodLogScreen showing today's mood, average, and calendar.
 */

import { Card, Body } from '@/src/shared/ui';
import { font, fontWeight } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Calendar } from 'react-native-calendars';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export interface MoodLogHeaderProps {
  todayMoodEmoji: string;
  averageMood: number;
  moodLogsCount: number;
  isLoading: boolean;
  moodLogMap: Record<string, number>;
  today: string;
  onDayPress: (day: { dateString: string }) => void;
}

const MoodLogHeader: React.FC<MoodLogHeaderProps> = ({
  todayMoodEmoji,
  averageMood,
  moodLogsCount,
  isLoading,
  moodLogMap,
  today,
  onDayPress,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View>
      {/* Today's Mood & Average */}
      <Card>
        <Body
          style={[
            styles.moodText,
            {
              fontSize: scaleFont(font.body, 0.3),
              marginBottom: scaleSpacing(theme.spacing.sm),
            },
          ]}
        >
          You logged: {todayMoodEmoji}
        </Body>
        {moodLogsCount > 0 && (
          <Body style={[styles.averageMoodText, { fontSize: scaleFont(font.bodyLarge, 0.3) }]}>
            Average Mood: {averageMood.toFixed(1)} / 4.0
          </Body>
        )}
      </Card>

      {/* Calendar */}
      {isLoading ? (
        <Card>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </Card>
      ) : (
        <View
          style={[
            styles.calendarContainer,
            {
              marginBottom: scaleSpacing(theme.spacing.lg),
              borderRadius: theme.radius.lg,
              ...theme.elevation.medium,
            },
          ]}
        >
          <Calendar
            style={styles.calendar}
            markedDates={Object.fromEntries(
              Object.entries(moodLogMap).map(([date]) => [
                date,
                {
                  marked: true,
                  dotColor: theme.colors.primary,
                  selected: date === today,
                },
              ]),
            )}
            theme={{
              selectedDayBackgroundColor: theme.colors.primary,
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              textSectionTitleColor: theme.colors.text,
              monthTextColor: theme.colors.text,
              dayTextColor: theme.colors.text,
              textDisabledColor: theme.colors.disabled,
              backgroundColor: theme.colors.surface,
              calendarBackground: theme.colors.surface,
              selectedDayTextColor: theme.colors.white,
            }}
            onDayPress={onDayPress}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  moodText: {
    textAlign: 'center',
    fontWeight: fontWeight.semibold,
  },
  averageMoodText: {
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  calendarContainer: {
    overflow: 'hidden',
    // Shadow/elevation applied inline via theme.elevation.medium
  },
  calendar: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
});

export default MoodLogHeader;
