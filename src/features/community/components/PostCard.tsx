/**
 * Post Card Component
 *
 * Animated post card with gradient borders, soft shadows, reaction buttons,
 * and smooth press animations. Replaces the old PostItem component.
 */

import { Avatar, Card } from '@/src/shared/ui';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, fontWeight } from '@/src/config/theme';
import { Post } from '@/src/domains/community';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { DIMENSIONS, SPACING, useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import ReactionBar from './ReactionBar';

export interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onPress?: () => void;
  onCommentPress?: () => void;
  onMenuPress?: () => void;
  commentsCount?: number;
}

const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  onPress,
  onCommentPress,
  onMenuPress,
  commentsCount = 0,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const postDate = normalizeTimestamp(post.createdAt);

  const cardScale = useSharedValue(1);
  const cardPressAnim = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(cardScale.value, { damping: 15, stiffness: 200, mass: 0.8 }) }],
  }));
  const handleCardPressIn = useCallback(() => {
    cardScale.value = 0.98;
  }, [cardScale]);
  const handleCardPressOut = useCallback(() => {
    cardScale.value = 1;
  }, [cardScale]);

  const commentScale = useSharedValue(1);
  const commentPressAnim = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(commentScale.value, { damping: 15, stiffness: 200, mass: 0.8 }) },
    ],
  }));
  const handleCommentPressIn = useCallback(() => {
    commentScale.value = 0.9;
  }, [commentScale]);
  const handleCommentPressOut = useCallback(() => {
    commentScale.value = 1;
  }, [commentScale]);

  const handleCommentPress = () => {
    impact('light');
    onCommentPress?.();
  };

  const handleMenuPress = () => {
    impact('light');
    onMenuPress?.();
  };

  const isEdited = post.isEdited;

  return (
    <Animated.View style={cardPressAnim}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        activeOpacity={0.95}
        style={styles.wrapper}
      >
        <LinearGradient
          colors={[theme.colors.primary + '10', theme.colors.secondary + '05']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientBorder,
            {
              padding: scaleSpacing(SPACING.lg),
              borderRadius: DIMENSIONS.cardBorderRadius,
            },
          ]}
        >
          <Card
            variant="elevated"
            padding={0}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: DIMENSIONS.cardBorderRadius,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Avatar uri={post.authorAvatar} size={scaleSpacing(40)} name={post.authorName} />
              <View style={[styles.headerText, { marginLeft: scaleSpacing(SPACING.sm) }]}>
                <Text
                  style={[
                    styles.authorName,
                    {
                      color: theme.colors.text,
                      fontSize: scaleFont(font.body),
                    },
                  ]}
                >
                  {post.authorName}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    {
                      color: theme.colors.text2,
                      fontSize: scaleFont(font.caption),
                      marginTop: scaleSpacing(SPACING.xs),
                    },
                  ]}
                >
                  {format(postDate, 'MMM d • h:mm a')} • {post.category}
                  {isEdited && ' • edited'}
                </Text>
              </View>
              {onMenuPress && (
                <TouchableOpacity
                  onPress={handleMenuPress}
                  style={styles.menuButton}
                  hitSlop={{
                    top: SPACING.sm,
                    bottom: SPACING.sm,
                    left: SPACING.sm,
                    right: SPACING.sm,
                  }}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={scaleFont(font.h4)}
                    color={theme.colors.text2}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Content */}
            <Text
              style={[
                styles.content,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(font.body),
                  lineHeight: scaleFont(24),
                  marginTop: scaleSpacing(SPACING.md),
                },
              ]}
            >
              {post.content}
            </Text>

            {/* Actions */}
            <View
              style={[
                styles.actions,
                {
                  marginTop: scaleSpacing(SPACING.md),
                  paddingTop: scaleSpacing(SPACING.md),
                  borderTopColor: theme.colors.border2,
                  borderTopWidth: 1,
                },
              ]}
            >
              <ReactionBar onReaction={() => impact('light')} />

              <Animated.View style={commentPressAnim}>
                <TouchableOpacity
                  onPress={handleCommentPress}
                  onPressIn={handleCommentPressIn}
                  onPressOut={handleCommentPressOut}
                  style={styles.commentButton}
                  {...getButtonAccessibility(
                    `View ${commentsCount} comments`,
                    'Double tap to view comments',
                  )}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={scaleFont(font.h4)}
                    color={theme.colors.primary}
                  />
                  {commentsCount > 0 && (
                    <Text
                      style={[
                        styles.commentCount,
                        {
                          color: theme.colors.text2,
                          fontSize: scaleFont(font.caption),
                          marginLeft: scaleSpacing(SPACING.xs),
                        },
                      ]}
                    >
                      {commentsCount}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Card>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const PostCard = React.memo(PostCardComponent);
PostCard.displayName = 'PostCard';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  gradientBorder: {
    // Padding and border radius applied inline
  },
  card: {
    // Background and border radius applied inline
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  menuButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  authorName: {
    fontWeight: fontWeight.semibold,
  },
  timestamp: {
    // Font size, color, and margin applied inline
  },
  content: {
    // Font size, color, line height, and margin applied inline
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Margin, padding, and border applied inline
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  commentCount: {
    fontWeight: fontWeight.semibold,
  },
});

export default PostCard;
