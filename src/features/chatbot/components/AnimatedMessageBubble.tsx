/**
 * Animated Message Bubble
 *
 * Wraps message bubbles with entrance animation and long-press support.
 */

import React, { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import MessageBubble from './MessageBubble';

interface AnimatedMessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
  isTyping?: boolean;
  onLongPress: () => void;
  index: number;
}

const AnimatedMessageBubbleComponent: React.FC<AnimatedMessageBubbleProps> = ({
  message,
  isUser,
  timestamp,
  isTyping,
  onLongPress,
  index,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateX = useSharedValue(isUser ? 50 : -50);

  useEffect(() => {
    opacity.value = withDelay(
      index * 50,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(
      index * 50,
      withSpring(1, { damping: 12, stiffness: 180, mass: 1, overshootClamping: false }),
    );
    translateX.value = withDelay(
      index * 50,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, opacity, scale, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.9}>
        <MessageBubble
          message={message}
          isUser={isUser}
          timestamp={timestamp}
          isTyping={isTyping}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedMessageBubble = React.memo(AnimatedMessageBubbleComponent);

AnimatedMessageBubble.displayName = 'AnimatedMessageBubble';

export default AnimatedMessageBubble;
