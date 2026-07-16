/**
 * Mood Tracker Screen
 *
 * Mood tracking screen with an emoji slider.
 * Mood selections guide journal prompts and help users understand their emotions.
 * Uses the shared app theme.
 */

import {
  MoodBurst,
  Body,
  Button,
  ButtonGroup,
  Card,
  ProtectedScreen,
  SectionTitle,
} from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';
import { ROUTES } from '@/src/config/navigation';
import { font } from '@/src/config/theme';
import { MOOD } from '@/src/config/constants';
import { useAuth, useErrorHandler, useTheme, useTypedNavigation } from '@/src/shared/hooks';
import { useHaptics } from '@/src/shared/hooks/haptics';
import type { JournalParams } from '@/src/shared/hooks/useTypedNavigation';
import { saveMoodLog } from '@/src/domains/wellbeing/moods';
import { ACCESSIBILITY_HINTS, ACCESSIBILITY_LABELS } from '@/src/shared/utils/accessibility';
import { useResponsive } from '@/src/shared/utils/responsive';
import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MOOD_EMOJIS = MOOD.emojis;
const MOOD_LABELS = MOOD.labels;

const MoodTrackerScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const { theme } = useTheme();
  const { user } = useAuth(); // ProtectedScreen ensures user is authenticated
  const { impact, notification } = useHaptics();
  const handleError = useErrorHandler();
  const { scaleFont, scaleSpacing } = useResponsive();
  const [moodValue, setMoodValue] = useState<number>(2); // Default to middle
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showBurst, setShowBurst] = useState<boolean>(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }
    };
  }, []);

  const handleMoodChange = (value: number) => {
    const roundedValue = Math.round(value);
    setMoodValue(roundedValue);
    impact('light');
  };

  const handleMoodSubmit = async () => {
    if (!user) return;

    await impact('medium');
    const moodEmoji = MOOD_EMOJIS[moodValue];
    const moodLabel = MOOD_LABELS[moodValue];

    setIsSaving(true);

    try {
      // Save mood to Firestore with timeout protection
      await Promise.race([
        saveMoodLog(user, moodValue, moodEmoji, moodLabel),
        new Promise<never>((_, reject) => {
          saveTimeoutRef.current = setTimeout(
            () => reject(new Error('Mood save timed out. Please try again.')),
            10000,
          );
        }),
      ]);

      // Clear timeout on success
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      setShowBurst(true);
      await notification('success');

      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }
      burstTimeoutRef.current = setTimeout(() => {
        setShowBurst(false);
        try {
          const journalParams: JournalParams = {
            moodEmoji,
            moodValue: moodValue.toString(),
          };
          navigation.push(ROUTES.journal, journalParams);
        } catch {
          // Navigation may fail if screen unmounted — safe to ignore
        }
      }, 1000);
    } catch (error) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      handleError(error, { context: 'Saving mood log' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewHistory = () => {
    impact('light');
    navigation.push(ROUTES.moodLog);
  };

  return (
    <ProtectedScreen
      title={TEXT.moodTracker}
      subtitle={TEXT.moodTrackerSubtitle}
      requireAuth={true}
    >
      <MoodBurst
        emoji={MOOD_EMOJIS[moodValue]}
        visible={showBurst}
        onComplete={() => setShowBurst(false)}
      />

      {/* Mood Selection Card */}
      <Card>
        <SectionTitle style={{ textAlign: 'center', marginBottom: scaleSpacing(theme.spacing.xl) }}>
          {TEXT.howAreYouFeeling}
        </SectionTitle>

        <View style={[styles.emojiContainer, { marginBottom: scaleSpacing(theme.spacing.xl) }]}>
          <Slider
            style={[styles.slider, { height: scaleSpacing(theme.spacing['3xl']) }]}
            minimumValue={0}
            maximumValue={4}
            step={1}
            value={moodValue}
            onValueChange={handleMoodChange}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border2}
            thumbTintColor={theme.colors.primary}
            accessibilityLabel={ACCESSIBILITY_LABELS.moodSlider}
            accessibilityHint={ACCESSIBILITY_HINTS.moodSlider}
          />
          <View style={[styles.emojiRow, { marginTop: scaleSpacing(theme.spacing.lg) }]}>
            {MOOD_EMOJIS.map((emoji: string, index: number) => (
              <View key={index} style={styles.emojiWrapper}>
                <Text
                  style={[
                    moodValue === index ? styles.selectedEmoji : styles.emoji,
                    {
                      opacity: moodValue === index ? 1 : 0.35,
                      fontSize: moodValue === index ? scaleFont(36, 0.3) : scaleFont(28, 0.3),
                    },
                  ]}
                  accessibilityLabel={ACCESSIBILITY_LABELS.moodEmoji(MOOD_LABELS[index])}
                >
                  {emoji}
                </Text>
                {moodValue === index && (
                  <Text
                    style={[
                      styles.moodLabel,
                      {
                        color: theme.colors.primary,
                        fontSize: scaleFont(font.labelSmall, 0.3),
                        marginTop: scaleSpacing(theme.spacing.xs),
                      },
                    ]}
                  >
                    {MOOD_LABELS[index]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <ButtonGroup>
          <Button
            title={isSaving ? 'Logging...' : 'Log Mood'}
            onPress={handleMoodSubmit}
            variant="primary"
            fullWidth
            disabled={isSaving}
            loading={isSaving}
          />
          <Button
            title="View Mood History"
            onPress={handleViewHistory}
            variant="secondary"
            fullWidth
          />
        </ButtonGroup>
      </Card>

      {/* Tips Card */}
      <Card>
        <SectionTitle style={{ textAlign: 'center', marginBottom: scaleSpacing(theme.spacing.lg) }}>
          Wellness Tips
        </SectionTitle>
        <View style={[styles.tipsList, { gap: scaleSpacing(theme.spacing.md) }]}>
          <Body style={{ color: theme.colors.text2 }}>
            {'\u2022'} Practice box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s.
          </Body>
          <Body style={{ color: theme.colors.text2 }}>
            {'\u2022'} Write down three things you are grateful for today.
          </Body>
          <Body style={{ color: theme.colors.text2 }}>
            {'\u2022'} Step outside for 10 minutes of sunlight and fresh air.
          </Body>
          <Body style={{ color: theme.colors.text2 }}>
            {'\u2022'} Reach out to a friend or loved one you trust.
          </Body>
        </View>
      </Card>
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  emojiContainer: {
    alignItems: 'center',
    width: '100%',
    // marginBottom applied inline
  },
  slider: {
    width: '100%',
    maxWidth: '100%',
    // height applied inline
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '100%',
    // marginTop applied inline
    alignItems: 'flex-start',
    paddingHorizontal: 0,
  },
  emojiWrapper: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Allow flex items to shrink below content size
  },
  emoji: {
    // fontSize applied inline
  },
  selectedEmoji: {
    // fontSize applied inline
  },
  moodLabel: {
    // fontSize and marginTop applied inline
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsList: {
    // gap applied inline
  },
});

export default MoodTrackerScreen;
