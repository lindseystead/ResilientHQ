/**
 * Message Bubble Component
 *
 * Reusable component for displaying chat messages.
 * Supports user and assistant messages with theme integration.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SPACING } from '@/src/shared/utils/responsive';
import { font, radius } from '@/src/config/theme';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  isTyping?: boolean;
}

/**
 * Typing Indicator Component with Pulsing Animation
 */
const TypingIndicator: React.FC<{
  isUser: boolean;
  theme: ReturnType<typeof useTheme>['theme'];
}> = ({ isUser, theme }) => {
  const dot1Opacity = useSharedValue(0.4);
  const dot2Opacity = useSharedValue(0.4);
  const dot3Opacity = useSharedValue(0.4);

  React.useEffect(() => {
    const createAnimation = (opacity: typeof dot1Opacity, delay: number) => {
      opacity.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) }), -1, true),
      );
    };

    createAnimation(dot1Opacity, 0);
    createAnimation(dot2Opacity, 200);
    createAnimation(dot3Opacity, 400);
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  const dotColor = isUser ? theme.colors.white : theme.colors.text2;

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { backgroundColor: dotColor }, dot1Style]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: dotColor }, dot2Style]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: dotColor }, dot3Style]} />
    </View>
  );
};

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
}) => {
  const { theme } = useTheme();
  const bubbleShadow = Platform.select({
    ios: {
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
  });

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
            borderColor: isUser ? theme.colors.primary : theme.colors.border2,
          },
          bubbleShadow,
        ]}
      >
        {!isUser && (
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={16} color={theme.colors.primary} style={styles.icon} />
          </View>
        )}
        {isTyping ? (
          <TypingIndicator isUser={isUser} theme={theme} />
        ) : (
          <Text
            style={[
              styles.messageText,
              {
                color: isUser ? theme.colors.white : theme.colors.text,
              },
            ]}
          >
            {message}
          </Text>
        )}
      </View>
      {timestamp && (
        <Text style={[styles.timestamp, { color: theme.colors.text2 }]}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );
};

const MessageBubble = React.memo(MessageBubbleComponent);
MessageBubble.displayName = 'MessageBubble';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: radius.xl,
    padding: SPACING.md + SPACING.xs / 2,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: SPACING.sm,
    marginTop: SPACING.xs / 2,
  },
  icon: {
    // Icon styling handled by Ionicons
  },
  messageText: {
    fontSize: font.body - 1,
    lineHeight: 22,
    flex: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
  },
  timestamp: {
    fontSize: font.captionSmall + 1,
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.xs,
  },
});

export default MessageBubble;
