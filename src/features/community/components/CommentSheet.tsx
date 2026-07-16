/**
 * Comment Sheet Component
 *
 * BottomSheet for displaying and adding comments with typing indicator,
 * skeleton loading, animated comment bubbles, and edit/delete/report support.
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { BottomSheet, Input, Button, ShimmerLoader } from '@/src/shared/ui';
import CommentCard from './CommentCard';
import PostActionMenu from './PostActionMenu';
import EditPostModal from './EditPostModal';
import ReportModal from './ReportModal';
import type { PostActionMenuRef } from './PostActionMenu';
import { Comment } from '@/src/domains/community';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';

export interface CommentSheetProps {
  visible: boolean;
  onClose: () => void;
  comments: Comment[];
  isLoading: boolean;
  onAddComment: (content: string) => Promise<void>;
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onReportComment?: (commentId: string, reason: string) => Promise<void>;
  isSubmitting: boolean;
  currentUserId?: string;
}

const CommentSheet: React.FC<CommentSheetProps> = ({
  visible,
  onClose,
  comments,
  isLoading,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReportComment,
  isSubmitting,
  currentUserId,
}) => {
  const { theme } = useTheme();
  const { impact, notification } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();
  const [commentText, setCommentText] = useState('');

  // Edit/Delete/Report State
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [isEditCommentVisible, setIsEditCommentVisible] = useState(false);
  const [isReportCommentVisible, setIsReportCommentVisible] = useState(false);
  const commentActionMenuRef = useRef<PostActionMenuRef>(null);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    impact('light');
    try {
      await onAddComment(commentText.trim());
      setCommentText('');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to add comment. Please try again.';
      Alert.alert('Unable to Comment', message);
    }
  };

  const handleCommentMenuPress = useCallback((comment: Comment) => {
    setSelectedComment(comment);
    commentActionMenuRef.current?.open();
  }, []);

  const handleEditComment = useCallback(
    async (content: string) => {
      if (!selectedComment?.id || !onEditComment) return;
      await onEditComment(selectedComment.id, content);
    },
    [selectedComment, onEditComment],
  );

  const handleDeleteComment = useCallback(() => {
    if (!selectedComment?.id || !onDeleteComment) return;

    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDeleteComment(selectedComment.id!);
            notification('success');
          } catch {
            notification('error');
            Alert.alert('Error', 'Failed to delete comment.');
          }
        },
      },
    ]);
  }, [selectedComment, onDeleteComment, notification]);

  const handleReportComment = useCallback(
    async (reason: string) => {
      if (!selectedComment?.id || !onReportComment) return;
      await onReportComment(selectedComment.id, reason);
    },
    [selectedComment, onReportComment],
  );

  const renderCommentItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentCard
        comment={item}
        currentUserId={currentUserId}
        onMenuPress={() => handleCommentMenuPress(item)}
      />
    ),
    [currentUserId, handleCommentMenuPress],
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Comments" snapPoints={['75%', '90%']}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <ShimmerLoader key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : comments.length > 0 ? (
          <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={(item, index) => item.id || `comment-${index}`}
            contentContainerStyle={[styles.commentsList, { padding: scaleSpacing(SPACING.lg) }]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(15),
                },
              ]}
            >
              No comments yet. Be the first to comment!
            </Text>
          </View>
        )}

        {/* Comment Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.surface,
              padding: scaleSpacing(SPACING.md),
              borderTopColor: theme.colors.border2,
              borderTopWidth: 1,
            },
          ]}
        >
          <Input
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            multiline
            containerStyle={styles.inputWrapper}
            style={styles.input}
          />
          <Button
            title={isSubmitting ? 'Posting...' : 'Post'}
            onPress={handleSubmit}
            variant="primary"
            size="small"
            disabled={!commentText.trim() || isSubmitting}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>
      </View>

      {/* Comment Action Menu */}
      <PostActionMenu
        ref={commentActionMenuRef}
        isOwner={selectedComment?.authorId === currentUserId}
        onEdit={() => setIsEditCommentVisible(true)}
        onDelete={handleDeleteComment}
        onReport={() => setIsReportCommentVisible(true)}
        type="comment"
      />

      {/* Edit Comment Modal */}
      <EditPostModal
        visible={isEditCommentVisible}
        onClose={() => {
          setIsEditCommentVisible(false);
          setSelectedComment(null);
        }}
        onSave={handleEditComment}
        initialContent={selectedComment?.content || ''}
        type="comment"
      />

      {/* Report Comment Modal */}
      <ReportModal
        visible={isReportCommentVisible}
        onClose={() => {
          setIsReportCommentVisible(false);
          setSelectedComment(null);
        }}
        onReport={handleReportComment}
        type="comment"
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  skeleton: {
    height: 80,
    borderRadius: SPACING.md,
    marginBottom: SPACING.md,
  },
  commentsList: {
    // Padding applied inline
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputContainer: {
    // Background, padding, and border applied inline
  },
  inputWrapper: {
    marginBottom: SPACING.sm,
  },
  input: {
    minHeight: 60,
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
});

export default CommentSheet;
