/**
 * Community Screen
 *
 * Unified layout system with proper scroll handling.
 * Uses ProtectedScreen with scroll={false} for custom scroll implementation.
 */

import {
  CommunityFilterBar,
  CommunityListFooter,
  CommunityListHeader,
  CommentSheet,
  CreatePostModal,
  EditPostModal,
  PostActionMenu,
  PostCard,
  ReportModal,
} from '../components';
import type { PostActionMenuRef } from '../components';
import {
  deletePost,
  updatePost,
  reportPost,
  updateComment,
  deleteComment,
  reportComment,
  Post,
} from '../services/community';
import {
  Card,
  EmptyState,
  FloatingActionButton,
  ProtectedScreen,
  SkeletonListItem,
} from '@/src/shared/ui';
import { useAuth, useTheme } from '@/src/shared/hooks';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useCommunityFeed, useCommunitySummary } from '../hooks';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { announceScreenChange } from '@/src/shared/utils/accessibility';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import { useResponsive } from '@/src/shared/utils/responsive';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

const CommunityScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { impact, notification } = useHaptics();
  const { scaleSpacing, insets } = useResponsive();
  const contentBottomPadding =
    TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(theme.spacing.sm));

  // Feed hook
  const feed = useCommunityFeed(user);
  const communitySummary = useCommunitySummary(feed.posts);

  // UI State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCommentSheetVisible, setIsCommentSheetVisible] = useState(false);
  const [isCreatePostVisible, setIsCreatePostVisible] = useState(false);

  // Edit/Delete/Report State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditPostVisible, setIsEditPostVisible] = useState(false);
  const [isReportPostVisible, setIsReportPostVisible] = useState(false);
  const postActionMenuRef = useRef<PostActionMenuRef>(null);

  // Screen animation
  const screenAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    autoStart: true,
  });

  // Announce screen change
  React.useEffect(() => {
    announceScreenChange('Community');
  }, []);

  // Get mood color for UI
  const moodColor = useMemo(() => {
    return theme.colors.primary;
  }, [theme]);

  // Handle comment press
  const handleCommentPress = useCallback(
    (postId: string) => {
      impact('light');
      setSelectedPostId(postId);
      setIsCommentSheetVisible(true);
    },
    [impact],
  );

  // Handle create post
  const handleCreatePost = useCallback(
    async (category: string, content: string, mood?: number) => {
      await feed.createPost(category, content, mood);
    },
    [feed],
  );

  // Handle add comment
  const handleAddComment = useCallback(
    async (content: string) => {
      if (!selectedPostId) return;
      await feed.addComment(selectedPostId, content);
    },
    [feed, selectedPostId],
  );

  // Handle post menu press
  const handlePostMenuPress = useCallback((post: Post) => {
    setSelectedPost(post);
    postActionMenuRef.current?.open();
  }, []);

  // Handle edit post
  const handleEditPost = useCallback(
    async (content: string) => {
      if (!user || !selectedPost?.id) return;
      await updatePost(user, selectedPost.id, content);
      // Refresh feed after edit
      feed.setFeedFilter(feed.feedFilter);
    },
    [user, selectedPost, feed],
  );

  // Handle delete post
  const handleDeletePost = useCallback(() => {
    if (!user || !selectedPost?.id) return;

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(user, selectedPost.id!);
              notification('success');
              // Refresh feed after delete
              feed.setFeedFilter(feed.feedFilter);
            } catch {
              notification('error');
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          },
        },
      ],
    );
  }, [user, selectedPost, feed, notification]);

  // Handle report post
  const handleReportPost = useCallback(
    async (reason: string) => {
      if (!user || !selectedPost?.id) return;
      await reportPost(user, selectedPost.id, reason);
    },
    [user, selectedPost],
  );

  // Handle edit comment
  const handleEditComment = useCallback(
    async (commentId: string, content: string) => {
      if (!user || !selectedPostId) return;
      await updateComment(user, selectedPostId, commentId, content);
    },
    [user, selectedPostId],
  );

  // Handle delete comment
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!user || !selectedPostId) return;
      await deleteComment(user, selectedPostId, commentId);
    },
    [user, selectedPostId],
  );

  // Handle report comment
  const handleReportComment = useCallback(
    async (commentId: string, reason: string) => {
      if (!user || !selectedPostId) return;
      await reportComment(user, selectedPostId, commentId, reason);
    },
    [user, selectedPostId],
  );

  // Get current posts based on filter
  const currentPosts = useMemo(() => {
    switch (feed.feedFilter) {
      case 'trending':
        return feed.trendingPosts;
      case 'recent':
        return feed.recentPosts;
      case 'myPosts':
        return feed.myPosts;
      case 'support':
        return feed.supportPosts;
      case 'forYou':
      default:
        return feed.moodBasedPosts.length > 0 ? feed.moodBasedPosts : feed.recentPosts;
    }
  }, [feed]);

  // Selected post comments
  const selectedPostComments = selectedPostId ? feed.comments[selectedPostId] || [] : [];
  const isLoadingSelectedComments = selectedPostId
    ? feed.isLoadingComments[selectedPostId] || false
    : false;

  const renderPostItem = useCallback(
    ({ item }: { item: (typeof currentPosts)[number] }) => (
      <PostCard
        post={item}
        currentUserId={user?.uid}
        onCommentPress={() => handleCommentPress(item.id || '')}
        onMenuPress={() => handlePostMenuPress(item)}
        commentsCount={feed.comments[item.id || '']?.length || 0}
      />
    ),
    [feed.comments, handleCommentPress, handlePostMenuPress, user?.uid],
  );

  return (
    <ProtectedScreen
      title="Community"
      requireAuth={true}
      showHeader={false}
      scroll={false}
      safeAreaTop={true}
      safeAreaBottom={true}
      includeTabBarPadding={false}
      safeBottom={true}
    >
      <Animated.View style={[screenAnimation.animatedStyle, styles.content]}>
        {/* Sticky Search & Filter Bar */}
        <CommunityFilterBar
          searchQuery={feed.searchQuery}
          onChangeSearch={feed.setSearchQuery}
          onClearSearch={() => feed.setSearchQuery('')}
          feedFilter={feed.feedFilter}
          onSelectFilter={feed.setFeedFilter}
        />

        <FlatList
          style={styles.scrollView}
          data={feed.isLoadingPosts ? [] : currentPosts}
          keyExtractor={(item, index) => item.id || `post-${index}`}
          renderItem={renderPostItem}
          ListHeaderComponent={
            <CommunityListHeader
              communitySummary={communitySummary}
              feedFilter={feed.feedFilter}
              moodColor={moodColor}
            />
          }
          ListFooterComponent={
            <CommunityListFooter
              hasMore={feed.hasMore}
              onLoadMore={feed.loadMore}
              resources={feed.resources}
              events={feed.events}
            />
          }
          ListEmptyComponent={
            feed.isLoadingPosts ? (
              <View style={{ paddingHorizontal: scaleSpacing(theme.spacing.lg) }}>
                <SkeletonListItem count={3} />
              </View>
            ) : (
              <Card>
                <EmptyState
                  icon="chatbubbles-outline"
                  message={
                    feed.searchQuery
                      ? 'No posts match your search.'
                      : 'No posts yet. Be the first to share!'
                  }
                />
              </Card>
            )
          }
          contentContainerStyle={[
            styles.scrollContent,
            {
              padding: scaleSpacing(theme.spacing.lg),
              paddingBottom: contentBottomPadding,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="automatic"
          accessible={true}
          accessibilityLabel="Community posts"
        />

        {/* FAB Button */}
        <FloatingActionButton
          icon="add"
          onPress={() => setIsCreatePostVisible(true)}
          accessibilityLabel="Create post"
          accessibilityHint="Tap to create a new community post"
        />
      </Animated.View>

      {/* Comment Sheet */}
      <CommentSheet
        visible={isCommentSheetVisible}
        onClose={() => {
          setIsCommentSheetVisible(false);
          setSelectedPostId(null);
        }}
        comments={selectedPostComments}
        isLoading={isLoadingSelectedComments}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onReportComment={handleReportComment}
        isSubmitting={false}
        currentUserId={user?.uid}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        visible={isCreatePostVisible}
        onClose={() => setIsCreatePostVisible(false)}
        onSubmit={handleCreatePost}
      />

      {/* Post Action Menu */}
      <PostActionMenu
        ref={postActionMenuRef}
        isOwner={selectedPost?.authorId === user?.uid}
        onEdit={() => setIsEditPostVisible(true)}
        onDelete={handleDeletePost}
        onReport={() => setIsReportPostVisible(true)}
        type="post"
      />

      {/* Edit Post Modal */}
      <EditPostModal
        visible={isEditPostVisible}
        onClose={() => {
          setIsEditPostVisible(false);
          setSelectedPost(null);
        }}
        onSave={handleEditPost}
        initialContent={selectedPost?.content || ''}
        type="post"
      />

      {/* Report Post Modal */}
      <ReportModal
        visible={isReportPostVisible}
        onClose={() => {
          setIsReportPostVisible(false);
          setSelectedPost(null);
        }}
        onReport={handleReportPost}
        type="post"
      />
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // padding applied inline with design tokens
    flexGrow: 1,
  },
});

export default CommunityScreen;
