/**
 * Self Care Screen
 *
 * Unified layout system with standard spacing.
 * Features categorized tips, shuffle, and daily affirmations.
 */

import { TipCard } from '../components';
import { ProtectedScreen, Section } from '@/src/shared/ui';
import AffirmationBlock from '@/src/shared/ui/components/AffirmationBlock';
import { TEXT } from '@/src/config/text';
import { useTheme } from '@/src/shared/hooks';
import { useStaggerList } from '@/src/shared/hooks/animation';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useSelfCareAffirmation } from '../hooks';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

interface SelfCareTip {
  tip: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
}

const TipItemWithAnimation: React.FC<{ item: SelfCareTip; index: number }> = ({ item, index }) => {
  const { animatedStyle } = useStaggerList({ index, staggerDelay: 50 });
  return (
    <Animated.View style={animatedStyle}>
      <TipCard tip={item.tip} icon={item.icon} />
    </Animated.View>
  );
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[], seed: number): T[] => {
  const shuffled = [...array];
  const random = createSeededRandom(seed || 1);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const SelfCareScreen: React.FC = () => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing, insets } = useResponsive();
  const listBottomPadding =
    TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(theme.spacing.sm));
  const { affirmation, isLoading: loading, refresh: fetchAffirmation } = useSelfCareAffirmation();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Date.now());

  // Build tips from config
  const allTips: SelfCareTip[] = useMemo(
    () =>
      TEXT.selfCareTipsList.map((tip, index) => ({
        tip,
        icon: (TEXT.selfCareTipIcons[index] || 'heart-outline') as keyof typeof Ionicons.glyphMap,
        category: TEXT.selfCareTipCategoryMap[index] || 'mind',
      })),
    [],
  );

  // Filtered and shuffled tips
  const displayedTips = useMemo(() => {
    const filtered =
      selectedCategory === 'All'
        ? allTips
        : allTips.filter((t) => t.category.toLowerCase() === selectedCategory.toLowerCase());
    return shuffleArray(filtered, shuffleSeed);
  }, [allTips, selectedCategory, shuffleSeed]);

  const categories = TEXT.selfCareCategories;

  const handleShuffle = useCallback(() => {
    impact('light');
    setShuffleSeed((prev) => prev + 1);
  }, [impact]);

  const handleCategorySelect = useCallback(
    (category: string) => {
      impact('light');
      setSelectedCategory(category);
    },
    [impact],
  );

  const renderTip = useCallback(
    ({ item, index }: { item: SelfCareTip; index: number }) => (
      <TipItemWithAnimation item={item} index={index} />
    ),
    [],
  );

  // List header component
  const ListHeaderComponent = useMemo(
    () => (
      <View>
        <AffirmationBlock
          affirmation={affirmation}
          isLoading={loading}
          onRefresh={fetchAffirmation}
        />

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.categoryContainer,
            { paddingHorizontal: scaleSpacing(theme.spacing.lg) },
          ]}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => handleCategorySelect(cat)}
              style={[
                styles.categoryPill,
                {
                  backgroundColor:
                    selectedCategory === cat ? theme.colors.primary : theme.colors.input,
                  paddingHorizontal: scaleSpacing(theme.spacing.md),
                  paddingVertical: scaleSpacing(theme.spacing.sm),
                  borderRadius: scaleSpacing(theme.radius.xl),
                  marginRight: scaleSpacing(theme.spacing.sm),
                  borderWidth: selectedCategory === cat ? 0 : 1,
                  borderColor: theme.colors.border2,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === cat ? theme.colors.white : theme.colors.text,
                    fontSize: scaleFont(13, 0.3),
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tips Header with Shuffle */}
        <View style={[styles.tipsHeader, { paddingHorizontal: scaleSpacing(theme.spacing.lg) }]}>
          <Section title={TEXT.practicalTips} />
          <TouchableOpacity
            onPress={handleShuffle}
            style={[
              styles.shuffleButton,
              {
                backgroundColor: theme.colors.primary + '15',
                paddingHorizontal: scaleSpacing(theme.spacing.md),
                paddingVertical: scaleSpacing(theme.spacing.xs),
                borderRadius: scaleSpacing(theme.radius.lg),
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shuffle-outline"
              size={scaleFont(16, 0.3)}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.shuffleText,
                {
                  color: theme.colors.primary,
                  fontSize: scaleFont(12, 0.3),
                  marginLeft: scaleSpacing(theme.spacing.xs),
                },
              ]}
            >
              Shuffle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      affirmation,
      loading,
      fetchAffirmation,
      selectedCategory,
      categories,
      theme,
      scaleFont,
      scaleSpacing,
      handleCategorySelect,
      handleShuffle,
    ],
  );

  return (
    <ProtectedScreen
      title={TEXT.selfCare}
      requireAuth={true}
      scroll={false}
      includeTabBarPadding={false}
    >
      <FlatList
        data={displayedTips}
        renderItem={renderTip}
        keyExtractor={(item) => item.tip}
        ListHeaderComponent={ListHeaderComponent}
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
        accessibilityLabel="Self care tips list"
      />
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryPill: {
    // Styles applied inline
  },
  categoryText: {
    fontWeight: '600',
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shuffleText: {
    fontWeight: '600',
  },
});

export default SelfCareScreen;
