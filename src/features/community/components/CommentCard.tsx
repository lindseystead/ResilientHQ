/**
 * Comment Card Component
 *
 * Reusable component for displaying individual comments.
 * Uses the shared app theme.
 * Supports edit/delete/report actions via onMenuPress.
 */

import { Avatar } from '@/src/shared/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { Comment } from '@/src/domains/community';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { font, spacing } from '@/src/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface CommentCardProps {
  comment: Comment;
  currentUserId?: string;
  onMenuPress?: () => void;
}

const CommentCardComponent: React.FC<CommentCardProps> = ({ comment, onMenuPress }) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const commentDate = normalizeTimestamp(comment.createdAt);
  const isEdited = comment.isEdited;

  const handleMenuPress = () => {
    impact('light');
    onMenuPress?.();
  };

  return (
    <View style={[styles.comment, { borderLeftColor: theme.colors.border2 }]}>
      <View style={styles.commentHeader}>
        <Avatar uri={comment.authorAvatar} size={32} name={comment.authorName} />
        <View style={styles.commentHeaderText}>
          <Text style={[styles.commentUsername, { color: theme.colors.primary }]}>
            {comment.authorName}
          </Text>
          <Text style={[styles.commentTimestamp, { color: theme.colors.text2 }]}>
            {format(commentDate, 'MMM d • h:mm a')}
            {isEdited && ' • edited'}
          </Text>
        </View>
        {onMenuPress && (
          <TouchableOpacity
            onPress={handleMenuPress}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.text2} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.commentContent, { color: theme.colors.text }]}>{comment.content}</Text>
    </View>
  );
};

const CommentCard = React.memo(CommentCardComponent);

const styles = StyleSheet.create({
  comment: {
    marginBottom: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  commentHeaderText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  commentUsername: {
    fontSize: font.bodySmall,
    fontWeight: '600',
  },
  commentTimestamp: {
    fontSize: font.captionSmall + 1,
    marginTop: 2,
  },
  commentContent: {
    fontSize: font.body - 1,
    lineHeight: 22,
    marginLeft: spacing.xl + spacing.lg,
  },
  menuButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

CommentCard.displayName = 'CommentCard';

export default CommentCard;
