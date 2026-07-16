/**
 * Community list header and footer sections
 */

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, SectionTitle } from '@/src/shared/ui';
import { font } from '@/src/config/theme';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';
import EventCard from './EventCard';
import ResourceCard from './ResourceCard';

type Resource = React.ComponentProps<typeof ResourceCard>['resource'];
type Event = React.ComponentProps<typeof EventCard>['event'];
type CommunityFeedFilter = 'forYou' | 'trending' | 'recent' | 'myPosts' | 'support';

interface CommunityListHeaderProps {
  communitySummary: string | null;
  feedFilter: CommunityFeedFilter;
  moodColor: string;
}

interface CommunityListFooterProps {
  hasMore: boolean;
  onLoadMore: () => void;
  resources: Resource[];
  events: Event[];
}

const FILTER_SECTION_TITLES: Record<CommunityFeedFilter, string> = {
  trending: 'Trending Now',
  forYou: 'Posts in Your Mood Category',
  recent: 'Recent Posts',
  myPosts: 'My Posts',
  support: 'Support Posts',
};

export const CommunityListHeader: React.FC<CommunityListHeaderProps> = ({
  communitySummary,
  feedFilter,
  moodColor,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <>
      {communitySummary && (
        <Card variant="elevated">
          <LinearGradient
            colors={[moodColor + '15', moodColor + '05']}
            style={[
              styles.summaryGradient,
              {
                padding: scaleSpacing(theme.spacing.lg),
                borderRadius: scaleSpacing(theme.spacing.lg),
              },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={scaleFont(font.body, 0.3)} color={moodColor} />
              <Text
                style={[
                  styles.summaryTitle,
                  {
                    color: theme.colors.text,
                    fontSize: scaleFont(font.body, 0.3),
                    marginLeft: scaleSpacing(theme.spacing.sm),
                  },
                ]}
              >
                Community Summary Today
              </Text>
            </View>
            <Text
              style={[
                styles.summaryText,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(font.label, 0.3),
                  lineHeight: scaleFont(font.body, 0.3),
                  marginTop: scaleSpacing(theme.spacing.sm),
                },
              ]}
            >
              {communitySummary}
            </Text>
          </LinearGradient>
        </Card>
      )}

      <View style={[styles.section, { marginBottom: scaleSpacing(theme.spacing.md) }]}>
        <SectionTitle>{FILTER_SECTION_TITLES[feedFilter]}</SectionTitle>
      </View>
    </>
  );
};

export const CommunityListFooter: React.FC<CommunityListFooterProps> = ({
  hasMore,
  onLoadMore,
  resources,
  events,
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();

  return (
    <>
      {hasMore && (
        <View
          style={[styles.loadMoreContainer, { paddingVertical: scaleSpacing(theme.spacing.lg) }]}
        >
          <Button title="Load More" onPress={onLoadMore} variant="outline" fullWidth />
        </View>
      )}

      {resources.length > 0 && (
        <View style={[styles.section, { marginTop: scaleSpacing(theme.spacing.lg) }]}>
          <SectionTitle>Recommended Resources</SectionTitle>
          <FlatList
            horizontal
            data={resources.slice(0, 5)}
            keyExtractor={(item, index) => item.id || `resource-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalScroll,
              { paddingRight: scaleSpacing(theme.spacing.md) },
            ]}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.resourceCard,
                  {
                    width: scaleSpacing(280),
                    marginRight: scaleSpacing(theme.spacing.md),
                  },
                ]}
              >
                <ResourceCard resource={item} />
              </View>
            )}
          />
        </View>
      )}

      {events.length > 0 && (
        <View style={[styles.section, { marginTop: scaleSpacing(theme.spacing.lg) }]}>
          <SectionTitle>Upcoming Events</SectionTitle>
          <FlatList
            horizontal
            data={events.slice(0, 5)}
            keyExtractor={(item, index) => item.id || `event-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalScroll,
              { paddingRight: scaleSpacing(theme.spacing.md) },
            ]}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.eventCard,
                  {
                    width: scaleSpacing(280),
                    marginRight: scaleSpacing(theme.spacing.md),
                  },
                ]}
              >
                <EventCard event={item} />
              </View>
            )}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  section: {},
  summaryGradient: {},
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitle: {
    fontWeight: '700',
  },
  summaryText: {},
  loadMoreContainer: {
    alignItems: 'center',
  },
  horizontalScroll: {},
  resourceCard: {},
  eventCard: {},
});
