/**
 * Mood Log Screen
 *
 * Unified layout system with standard spacing.
 */

import { MoodLogFooter, MoodLogHeader } from '../components';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { Card, EmptyText, ProtectedScreen, SectionTitle } from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';
import { ROUTES } from '@/src/config/navigation';
import { font } from '@/src/config/theme';
import { useTheme, useTypedNavigation } from '@/src/shared/hooks';
import { useStaggerList } from '@/src/shared/hooks/animation';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useMoodLogs } from '../hooks';
import type { HomeStackParamList } from '@/src/navigation/types';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import { MOOD } from '@/src/config/constants';
import { useResponsive } from '@/src/shared/utils/responsive';
import type { RouteProp } from '@react-navigation/native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useCallback, useMemo } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

const MOOD_EMOJIS = MOOD.emojis;

interface MoodLogItem {
  date: string;
  mood: number;
  moodEmoji: string;
  moodLabel: string;
}

type MoodLogScreenRouteProp = RouteProp<HomeStackParamList, 'MoodLog'>;

const MoodLogScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const route = useRoute<MoodLogScreenRouteProp>();
  const params = route.params || undefined;
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing, insets } = useResponsive();
  const listBottomPadding =
    TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(theme.spacing.sm));

  // Get mood from route params if coming from mood tracker (used in todayMoodEmoji calculation)
  const moodEmoji = params?.moodEmoji || undefined;

  // Use hook for mood logs data
  const { moodLogs, moodLogMap, averageMood, isLoading, refresh } = useMoodLogs(100);

  // Fetch mood logs when screen is focused (and on first mount)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const MoodItemWithAnimation: React.FC<{ item: MoodLogItem; index: number }> = ({
    item,
    index,
  }) => {
    const { animatedStyle } = useStaggerList({ index, staggerDelay: 40 });
    return (
      <Animated.View style={animatedStyle}>
        <View style={styles.moodItemWrapper}>
          <Card>
            <Text
              style={[
                styles.cardDate,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(font.body, 0.3),
                  marginBottom: scaleSpacing(theme.spacing.sm),
                },
              ]}
            >
              {format(new Date(item.date), 'MMMM d, yyyy')}
            </Text>
            <View
              style={[
                styles.moodRow,
                {
                  gap: scaleSpacing(theme.spacing.md),
                },
              ]}
            >
              <Text style={[styles.cardMood, { fontSize: scaleFont(font.h1, 0.3) }]}>
                {item.moodEmoji}
              </Text>
              <Text
                style={[
                  styles.moodLabel,
                  {
                    color: theme.colors.text2,
                    fontSize: scaleFont(font.body, 0.3),
                  },
                ]}
              >
                {item.moodLabel}
              </Text>
            </View>
          </Card>
        </View>
      </Animated.View>
    );
  };

  const renderMoodItem = ({ item, index }: { item: MoodLogItem; index: number }) => (
    <MoodItemWithAnimation item={item} index={index} />
  );

  const moodData: MoodLogItem[] = useMemo(
    () =>
      moodLogs.map((log) => {
        const timestampDate = normalizeTimestamp(log.timestamp);
        const date = format(timestampDate, 'yyyy-MM-dd');
        return {
          date,
          mood: log.moodValue,
          moodEmoji: log.moodEmoji,
          moodLabel: log.moodLabel,
        };
      }),
    [moodLogs],
  );

  const today = new Date().toISOString().split('T')[0];
  const isMoodLogged = moodLogMap[today] !== undefined;
  const todayMoodEmoji = isMoodLogged
    ? MOOD_EMOJIS[moodLogMap[today]]
    : moodEmoji || 'No mood logged';

  const handleDayPress = useCallback(
    (day: { dateString: string }) => {
      impact('light');
      const mood = moodLogMap[day.dateString];
      const moodEmojiForDay = mood !== undefined ? MOOD_EMOJIS[mood] : null;
      const moodLog = moodLogs.find((log) => {
        const timestampDate = normalizeTimestamp(log.timestamp);
        const logDate = format(timestampDate, 'yyyy-MM-dd');
        return logDate === day.dateString;
      });

      // Show mood info (simplified - could use a modal in future)
      if (moodLog) {
        const message = `${moodEmojiForDay} ${moodLog.moodLabel}${moodLog.notes ? `\n\nNotes: ${moodLog.notes}` : ''}`;
        Alert.alert(`Mood for ${format(new Date(day.dateString), 'MMMM d, yyyy')}`, message);
      } else {
        Alert.alert(
          `Mood for ${format(new Date(day.dateString), 'MMMM d, yyyy')}`,
          'No mood logged for this day',
        );
      }
    },
    [impact, moodLogMap, moodLogs],
  );

  const handleResourcePress = useCallback(
    (phoneNumber: string, resourceName: string) => {
      impact('light');
      // Resource info display (simplified - could use a modal in future)
      Alert.alert(resourceName, phoneNumber, [
        { text: 'OK' },
        {
          text: 'Call',
          onPress: () => {
            // In production, would use Linking to call
          },
        },
      ]);
    },
    [impact],
  );

  const handleJournalPress = useCallback(() => {
    impact('medium');
    navigation.push(ROUTES.journal);
  }, [impact, navigation]);

  // List header component
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <MoodLogHeader
          todayMoodEmoji={todayMoodEmoji}
          averageMood={averageMood}
          moodLogsCount={moodLogs.length}
          isLoading={isLoading}
          moodLogMap={moodLogMap}
          today={today}
          onDayPress={handleDayPress}
        />

        {/* Mood History Header */}
        <Card>
          <SectionTitle>Mood Log History</SectionTitle>
          {moodData.length === 0 && (
            <EmptyText>
              No mood logs yet. Start tracking your mood to see your history here.
            </EmptyText>
          )}
        </Card>
      </View>
    ),
    [
      todayMoodEmoji,
      averageMood,
      moodLogs.length,
      isLoading,
      moodLogMap,
      today,
      handleDayPress,
      moodData.length,
    ],
  );

  // List footer component
  const ListFooterComponent = useMemo(
    () => (
      <MoodLogFooter onResourcePress={handleResourcePress} onJournalPress={handleJournalPress} />
    ),
    [handleResourcePress, handleJournalPress],
  );

  return (
    <ProtectedScreen
      title={TEXT.moodHistory}
      requireAuth={true}
      scroll={false}
      includeTabBarPadding={false}
    >
      <FlatList
        data={moodData}
        renderItem={renderMoodItem}
        keyExtractor={(item) => item.date}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: listBottomPadding,
          },
        ]}
        scrollEnabled={true}
        nestedScrollEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        scrollEventThrottle={16}
        accessible={true}
        accessibilityLabel="Mood log history"
      />
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  cardDate: {
    fontWeight: '600',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodItemWrapper: {
    marginBottom: 0,
  },
  cardMood: {
    // fontSize applied inline
  },
  moodLabel: {
    fontWeight: '500',
  },
});

export default MoodLogScreen;
