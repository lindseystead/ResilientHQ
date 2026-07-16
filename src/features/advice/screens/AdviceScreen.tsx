/**
 * Advice Screen
 *
 * Unified layout system with standard spacing.
 * Uses ProtectedScreen with scroll={false} for custom scroll implementation.
 */

import {
  Body,
  Button,
  ButtonGroup,
  Card,
  FloatingActionButton,
  ProtectedScreen,
  SectionTitle,
  TipItem,
} from '@/src/shared/ui';
import { ROUTES } from '@/src/config/navigation';
import { FEATURES } from '@/src/config/constants';
import {
  buildResiliencePlan,
  EncouragementItem,
  EnergyCheckItem,
  getResilienceContentDeck,
  getUserMoodLogs,
  MoodLog,
  ResilienceContentDeck,
  ResilienceResource,
  useWellbeingAffirmation,
  WellnessTip,
} from '@/src/domains/wellbeing';
import { useAuth, useErrorHandler, useTheme, useTypedNavigation } from '@/src/shared/hooks';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useScreenTransition } from '@/src/shared/hooks/animation/useScreenTransition';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { logger } from '@/src/shared/utils/debug';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import {
  AdviceListHeader,
  AdviceResetSheet,
  AdviceResourceItem,
  AdviceTipCard,
} from '../components';
import { ADVICE_RESET_STEPS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, SectionList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

const STREAK_STORAGE_KEY = '@advice_screen_streak';
const LAST_VISIT_KEY = '@advice_screen_last_visit';

type AdviceSectionItem =
  | WellnessTip
  | string
  | EnergyCheckItem[]
  | EncouragementItem[]
  | ResilienceResource;

type AdviceSection = {
  key: 'tips' | 'grounding' | 'energy' | 'encouragement' | 'resources';
  title: string;
  data: AdviceSectionItem[];
};

const AdviceScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const handleError = useErrorHandler();
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { user } = useAuth();
  const { scaleFont, scaleSpacing, insets } = useResponsive();
  const contentBottomPadding =
    TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(theme.spacing.sm));
  const isChatbotEnabled = FEATURES.aiChatEnabled;

  // State
  const [latestMood, setLatestMood] = useState<MoodLog | null>(null);
  const [isLoadingMood, setIsLoadingMood] = useState(true);
  const [streak, setStreak] = useState<number>(0);
  const [isLoadingStreak, setIsLoadingStreak] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<number>(0);
  const [contentDeck, setContentDeck] = useState<ResilienceContentDeck>(() =>
    getResilienceContentDeck(),
  );
  const {
    affirmation,
    isLoading: isLoadingAffirmation,
    refresh: refreshAffirmation,
  } = useWellbeingAffirmation();

  // Animation hooks
  const moodCardAnimation = useFadeAnimation({ delay: 100 });
  const affirmationAnimation = useFadeAnimation({ delay: 200 });
  const tipsAnimation = useScreenTransition({ type: 'slideUp', delay: 300 });
  const resiliencePlan = useMemo(() => buildResiliencePlan(latestMood), [latestMood]);

  // Fetch latest mood log
  useEffect(() => {
    const fetchLatestMood = async () => {
      if (!user) {
        setIsLoadingMood(false);
        return;
      }

      try {
        setIsLoadingMood(true);
        const logs = await getUserMoodLogs(user, 1);
        setLatestMood(logs.length > 0 ? logs[0] : null);
      } catch (error) {
        logger.error('Error fetching mood logs', error);
        setLatestMood(null);
      } finally {
        setIsLoadingMood(false);
      }
    };

    fetchLatestMood();
  }, [user]);

  // Streak tracking
  useEffect(() => {
    const updateStreak = async () => {
      try {
        const today = new Date().toDateString();
        const lastVisit = await AsyncStorage.getItem(LAST_VISIT_KEY);
        const currentStreak = await AsyncStorage.getItem(STREAK_STORAGE_KEY);

        if (lastVisit === today) {
          setStreak(currentStreak ? parseInt(currentStreak, 10) : 0);
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toDateString();

          if (lastVisit === yesterdayStr) {
            const newStreak = currentStreak ? parseInt(currentStreak, 10) + 1 : 1;
            await AsyncStorage.setItem(STREAK_STORAGE_KEY, newStreak.toString());
            setStreak(newStreak);
          } else {
            await AsyncStorage.setItem(STREAK_STORAGE_KEY, '1');
            setStreak(1);
          }

          await AsyncStorage.setItem(LAST_VISIT_KEY, today);
        }
      } catch (error) {
        logger.error('Error updating streak', error);
        setStreak(0);
      } finally {
        setIsLoadingStreak(false);
      }
    };

    updateStreak();
  }, []);

  // Shuffle advice
  const handleShuffle = useCallback(() => {
    impact('medium');
    setContentDeck(getResilienceContentDeck());
  }, [impact]);

  // Reset modal handlers
  const handleOpenReset = useCallback(() => {
    impact('light');
    setShowResetModal(true);
    setResetStep(0);
  }, [impact]);

  const handleCloseReset = useCallback(() => {
    setShowResetModal(false);
    setResetStep(0);
  }, []);

  const handleNextResetStep = useCallback(() => {
    impact('light');
    if (resetStep < 2) {
      setResetStep(resetStep + 1);
    } else {
      handleCloseReset();
    }
  }, [resetStep, impact, handleCloseReset]);

  // Link handler
  const handleLink = useCallback(
    async (url: string) => {
      await impact('light');
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          handleError(new Error('Cannot open this link.'), { context: 'Opening link' });
        }
      } catch (error) {
        handleError(error, { context: 'Opening link' });
      }
    },
    [impact, handleError],
  );

  // Navigation handlers
  const handleChatbotPress = useCallback(() => {
    if (!isChatbotEnabled) {
      handleOpenReset();
      return;
    }
    impact('medium');
    navigation.push(ROUTES.chatbot);
  }, [handleOpenReset, impact, isChatbotEnabled, navigation]);

  const handleFABPress = useCallback(() => {
    if (!isChatbotEnabled) {
      handleOpenReset();
      return;
    }
    impact('medium');
    navigation.push(ROUTES.chatbot);
  }, [handleOpenReset, impact, isChatbotEnabled, navigation]);

  const sections: AdviceSection[] = useMemo(() => {
    const allSections: AdviceSection[] = [
      { key: 'tips', title: 'Resilience Habits', data: contentDeck.tips },
      { key: 'grounding', title: 'Regulation Reset', data: contentDeck.groundingIdeas },
      { key: 'energy', title: 'Energy Check', data: [contentDeck.energyCheck] },
      { key: 'encouragement', title: 'Keep Going', data: [contentDeck.encouragement] },
      { key: 'resources', title: 'Trusted Guidance', data: contentDeck.resources },
    ];
    return allSections.filter((section) => section.data.length > 0);
  }, [contentDeck]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: AdviceSection }) => (
      <Animated.View style={tipsAnimation.animatedStyle}>
        <SectionTitle>{section.title}</SectionTitle>
      </Animated.View>
    ),
    [tipsAnimation.animatedStyle],
  );

  const renderSectionItem = useCallback(
    ({ item, section }: { item: AdviceSectionItem; section: AdviceSection }) => {
      switch (section.key) {
        case 'tips':
          return (
            <Animated.View style={tipsAnimation.animatedStyle}>
              <AdviceTipCard tip={item as WellnessTip} />
            </Animated.View>
          );
        case 'grounding':
          return (
            <Animated.View style={tipsAnimation.animatedStyle}>
              <Card>
                <TipItem icon="sunny-outline" text={item as string} />
              </Card>
            </Animated.View>
          );
        case 'energy':
          return (
            <Animated.View style={tipsAnimation.animatedStyle}>
              <Card>
                {(item as EnergyCheckItem[]).map(({ text, icon }, index) => (
                  <TipItem
                    key={`${icon}-${index}`}
                    icon={icon as keyof typeof Ionicons.glyphMap}
                    text={text}
                  />
                ))}
              </Card>
            </Animated.View>
          );
        case 'encouragement':
          return (
            <Animated.View style={tipsAnimation.animatedStyle}>
              <Card>
                {(item as EncouragementItem[]).map(({ quote, icon }, index) => (
                  <View
                    key={`${icon}-${index}`}
                    style={[styles.quoteItem, { marginVertical: scaleSpacing(theme.spacing.sm) }]}
                  >
                    <Ionicons
                      name={icon as keyof typeof Ionicons.glyphMap}
                      size={scaleFont(24, 0.3)}
                      color={theme.colors.primary}
                    />
                    <Body
                      style={[styles.quoteText, { marginLeft: scaleSpacing(theme.spacing.md) }]}
                      numberOfLines={3}
                    >
                      &quot;{quote}&quot;
                    </Body>
                  </View>
                ))}
              </Card>
            </Animated.View>
          );
        case 'resources':
          return (
            <Animated.View style={tipsAnimation.animatedStyle}>
              <AdviceResourceItem item={item as ResilienceResource} onPress={handleLink} />
            </Animated.View>
          );
        default:
          return null;
      }
    },
    [handleLink, scaleFont, scaleSpacing, theme, tipsAnimation.animatedStyle],
  );

  const keyExtractor = useCallback((item: AdviceSectionItem, index: number) => {
    if (typeof item === 'string') {
      return `text-${item}`;
    }
    if (Array.isArray(item)) {
      const first = item[0] as { icon?: string } | undefined;
      const seed = first?.icon || item.length;
      return `group-${seed}-${index}`;
    }
    if (item && typeof item === 'object') {
      if ('id' in item) {
        return `id-${item.id}`;
      }
      if ('title' in item) {
        return `title-${item.title}`;
      }
    }
    return `item-${index}`;
  }, []);

  return (
    <ProtectedScreen
      title="Advice"
      requireAuth={false}
      scroll={false}
      safeAreaTop={true}
      safeAreaBottom={true}
      includeTabBarPadding={false}
      safeBottom={true}
    >
      <SectionList<AdviceSectionItem, AdviceSection>
        style={styles.scrollView}
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderSectionItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={
          <AdviceListHeader
            streak={streak}
            isLoadingStreak={isLoadingStreak}
            resiliencePlan={resiliencePlan}
            isLoadingMood={isLoadingMood}
            affirmation={affirmation}
            isLoadingAffirmation={isLoadingAffirmation}
            onRefreshAffirmation={refreshAffirmation}
            onShuffle={handleShuffle}
            moodCardAnimatedStyle={moodCardAnimation.animatedStyle}
            affirmationAnimatedStyle={affirmationAnimation.animatedStyle}
            tipsAnimatedStyle={tipsAnimation.animatedStyle}
          />
        }
        ListFooterComponent={
          <Animated.View style={tipsAnimation.animatedStyle}>
            <ButtonGroup>
              {isChatbotEnabled ? (
                <Button
                  title="Chat with Bot"
                  onPress={handleChatbotPress}
                  variant="primary"
                  icon="chatbubbles-outline"
                  iconPosition="left"
                  style={{ flex: 1 }}
                />
              ) : null}
              <Button
                title="1-Min Reset"
                onPress={handleOpenReset}
                variant="secondary"
                icon="timer-outline"
                iconPosition="left"
                style={{ flex: 1 }}
              />
            </ButtonGroup>
          </Animated.View>
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        accessible={true}
        accessibilityLabel="Advice content"
      />

      {/* Floating Action Button */}
      {isChatbotEnabled ? (
        <FloatingActionButton
          icon="bulb-outline"
          onPress={handleFABPress}
          accessibilityLabel="Need a Nudge?"
          accessibilityHint="Open the guided support chat"
        />
      ) : null}

      <AdviceResetSheet
        visible={showResetModal}
        resetStep={Math.min(resetStep, ADVICE_RESET_STEPS.length - 1)}
        onClose={handleCloseReset}
        onNextStep={handleNextResetStep}
      />
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // padding applied inline with theme tokens
    flexGrow: 1,
  },
  quoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quoteText: {
    flex: 1,
    fontStyle: 'italic',
  },
});

export default AdviceScreen;
