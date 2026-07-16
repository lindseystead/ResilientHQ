/**
 * Empty State Component
 *
 * Reusable empty state component for displaying when lists or content are empty.
 * Uses the shared app theme.
 */

import { useFadeAnimation, useMountSpring } from '@/src/shared/hooks/animation';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
  action?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  const { theme } = useTheme();
  const { scaleSpacing, scaleFont } = useResponsive();

  // Empty state animation: gentle fade + scale
  const { animatedStyle: fadeStyle } = useFadeAnimation({ duration: 400, delay: 100 });
  const { animatedStyle: springStyle } = useMountSpring({
    initialScale: 0.9,
    targetScale: 1,
    delay: 100,
  });

  const combinedAnimation = {
    ...fadeStyle,
    ...springStyle,
  };

  return (
    <AnimatedView style={[styles.container, combinedAnimation]}>
      {icon && (
        <Ionicons
          name={icon}
          size={scaleFont(48, 0.3)}
          color={theme.colors.text2}
          style={[styles.icon, { marginBottom: scaleSpacing(theme.spacing.lg) }]}
        />
      )}
      {title && (
        <AnimatedText
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: scaleFont(20, 0.3),
              marginBottom: scaleSpacing(theme.spacing.sm),
            },
          ]}
        >
          {title}
        </AnimatedText>
      )}
      <AnimatedText
        style={[
          styles.message,
          {
            color: theme.colors.text2,
            fontSize: scaleFont(16, 0.3),
            marginBottom: scaleSpacing(theme.spacing.xl),
          },
        ]}
      >
        {message}
      </AnimatedText>
      {action && <View style={styles.actionContainer}>{action}</View>}
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60, // theme.spacing['3xl'] * 1.5
    paddingHorizontal: 20, // theme.spacing.lg + theme.spacing.sm
  },
  icon: {
    // marginBottom applied inline
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    // fontSize and marginBottom applied inline
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    // fontSize and marginBottom applied inline
  },
  actionContainer: {
    marginTop: 8, // theme.spacing.sm
  },
});

export default EmptyState;
