/**
 * Community filter and search header
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import CategorySelector from './CategorySelector';
import { SearchBar } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';

type CommunityFeedFilter = 'forYou' | 'trending' | 'recent' | 'myPosts' | 'support';

interface CommunityFilterBarProps {
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  onClearSearch: () => void;
  feedFilter: CommunityFeedFilter;
  onSelectFilter: (filter: CommunityFeedFilter) => void;
}

const FILTER_TO_LABEL: Record<CommunityFeedFilter, string> = {
  forYou: 'For You',
  trending: 'Trending',
  recent: 'Recent',
  myPosts: 'My Posts',
  support: 'Support',
};

const LABEL_TO_FILTER: Record<string, CommunityFeedFilter> = {
  'For You': 'forYou',
  Trending: 'trending',
  Recent: 'recent',
  'My Posts': 'myPosts',
  Support: 'support',
};

export const CommunityFilterBar: React.FC<CommunityFilterBarProps> = ({
  searchQuery,
  onChangeSearch,
  onClearSearch,
  feedFilter,
  onSelectFilter,
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();

  return (
    <View
      style={[
        styles.filterBar,
        {
          backgroundColor: theme.colors.surface,
          paddingTop: scaleSpacing(theme.spacing.md),
          paddingBottom: scaleSpacing(theme.spacing.sm),
          borderBottomColor: theme.colors.border2,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View
        style={{
          marginBottom: scaleSpacing(theme.spacing.md),
          marginHorizontal: scaleSpacing(theme.spacing.md),
        }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={onChangeSearch}
          onClear={onClearSearch}
          placeholder="Search posts..."
        />
      </View>

      <CategorySelector
        selectedCategory={FILTER_TO_LABEL[feedFilter]}
        onSelectCategory={(category: string) =>
          onSelectFilter(LABEL_TO_FILTER[category] || 'forYou')
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  filterBar: {
    width: '100%',
  },
});
