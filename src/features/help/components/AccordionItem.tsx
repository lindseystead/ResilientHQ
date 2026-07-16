/**
 * Accordion Item Component
 *
 * Reusable accordion item with expand/collapse animation.
 * Used for FAQ sections and collapsible content.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, radius, spacing } from '@/src/config/theme';

const ACCORDION_PADDING = spacing.lg + spacing.xs / 2;

interface AccordionItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  question,
  answer,
  isExpanded,
  onToggle,
}) => {
  const { theme } = useTheme();
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
  });
  const rotateProgress = useSharedValue(0);
  const heightProgress = useSharedValue(0);

  useEffect(() => {
    const targetValue = isExpanded ? 1 : 0;
    rotateProgress.value = withTiming(targetValue, { duration: 300 });
    heightProgress.value = withTiming(targetValue, { duration: 300 });
  }, [isExpanded, rotateProgress, heightProgress]);

  const rotateStyle = useAnimatedStyle(() => {
    const rotation = interpolate(rotateProgress.value, [0, 1], [0, Math.PI]);
    return {
      transform: [{ rotate: `${rotation}rad` }],
    };
  });

  const heightStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(heightProgress.value, [0, 1], [0, 500]);
    return {
      maxHeight,
      opacity: heightProgress.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }, shadowStyle]}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.header}
        activeOpacity={0.7}
        accessibilityLabel={question}
        accessibilityHint={isExpanded ? 'Tap to collapse' : 'Tap to expand'}
      >
        <Text style={[styles.question, { color: theme.colors.text }]}>{question}</Text>
        <Animated.View style={rotateStyle}>
          <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            borderTopColor: theme.colors.border2,
          },
          heightStyle,
        ]}
      >
        <Text style={[styles.answer, { color: theme.colors.text2 }]}>{answer}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ACCORDION_PADDING,
  },
  question: {
    fontSize: font.body,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
  },
  contentContainer: {
    borderTopWidth: 1,
    paddingHorizontal: ACCORDION_PADDING,
    paddingBottom: ACCORDION_PADDING,
    overflow: 'hidden',
  },
  answer: {
    fontSize: font.bodySmall + 1,
    lineHeight: 22,
    paddingTop: spacing.md,
  },
});

export default AccordionItem;
