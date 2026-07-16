/**
 * Mood Burst Animation Component
 *
 * Animated emoji burst effect for mood logging.
 * Creates a celebratory animation when mood is logged.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '@/src/shared/hooks/haptics';

const BURST_EMOJI_SIZE = 80;

export interface MoodBurstProps {
  emoji: string;
  onComplete?: () => void;
  visible: boolean;
}

export const MoodBurst: React.FC<MoodBurstProps> = ({ emoji, onComplete, visible }) => {
  const { notification } = useHaptics();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    if (visible) {
      notification('success');
      scale.value = withSequence(
        withSpring(1.5, { damping: 12, stiffness: 180, mass: 1, overshootClamping: false }),
        withSpring(1, { damping: 12, stiffness: 180, mass: 1, overshootClamping: false }),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 250 }),
        withDelay(500, withTiming(0, { duration: 250 })),
      );
      rotation.value = withSpring(360, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
      });

      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      completionTimeoutRef.current = setTimeout(() => {
        handleComplete();
      }, 1000);
    } else {
      scale.value = 0;
      opacity.value = 0;
      rotation.value = 0;
    }
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [handleComplete, notification, opacity, rotation, scale, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${(rotation.value * Math.PI) / 180}rad` }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.burst, animatedStyle]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  burst: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: BURST_EMOJI_SIZE,
  },
});
