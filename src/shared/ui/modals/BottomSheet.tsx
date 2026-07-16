/**
 * Bottom Sheet Component
 *
 * Bottom sheet built on @gorhom/bottom-sheet.
 * Features:
 * - Responsive design with tablet-aware layouts
 * - Full accessibility support with focus management
 * - Smooth fade + slide-up animations
 * - Micro-interactions and haptic feedback
 * - Theme-based styling with responsive spacing
 * - Safe area handling
 *
 */

import { useHaptics } from '@/src/shared/hooks/haptics';
import { useTraumaSafeMode } from '@/src/providers/TraumaSafeModeProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import {
  ACCESSIBILITY_HINTS,
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_ROLES,
  announceScreenChange,
  getButtonAccessibility,
  useFocusManagement,
} from '@/src/shared/utils/accessibility';
import { SPACING, useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import BottomSheetLib from '@gorhom/bottom-sheet';
import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface BottomSheetProps {
  children: ReactNode;
  visible: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  title?: string;
  showCloseButton?: boolean;
  enablePanDownToClose?: boolean;
  enableOverDrag?: boolean;
  onAnimate?: (fromIndex: number, toIndex: number) => void;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  visible,
  onClose,
  snapPoints = ['50%', '90%'],
  title,
  showCloseButton = true,
  enablePanDownToClose = true,
  enableOverDrag = false,
  onAnimate,
}) => {
  const { theme } = useTheme();
  const { traumaSafeMode } = useTraumaSafeMode();
  const { impact } = useHaptics();
  const bottomSheetRef = useRef<BottomSheetLib>(null);
  const { scaleSpacing, scaleFont, insets, isTablet } = useResponsive();

  // Fade + slide-up animation
  const slideY = useSharedValue(50);
  const fadeOpacity = useSharedValue(0);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus management for accessibility
  const { focusRef, focus } = useFocusManagement<View>(false);

  // Note: Using manual animation values for more control over sheet entrance

  // Animated style for sheet entrance
  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeOpacity.value,
      transform: [{ translateY: slideY.value }],
    };
  }, []);

  // Handle sheet visibility changes
  useEffect(() => {
    if (visible) {
      // Animate in
      fadeOpacity.value = withTiming(1, {
        duration: traumaSafeMode ? 180 : 300,
        easing: Easing.out(Easing.cubic),
      });
      if (traumaSafeMode) {
        slideY.value = withTiming(0, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        slideY.value = withSpring(0, {
          damping: 12,
          stiffness: 180,
          mass: 1,
          overshootClamping: false,
        });
      }

      // Expand sheet
      bottomSheetRef.current?.expand();

      // Haptic feedback
      if (!traumaSafeMode) {
        impact('light');
      }

      // Announce to screen readers
      if (title) {
        announceScreenChange(title);
      }

      // Focus on title after animation
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = setTimeout(() => {
        if (title) {
          focus();
        }
      }, 350);
    } else {
      // Animate out
      fadeOpacity.value = withTiming(0, {
        duration: traumaSafeMode ? 180 : 250,
        easing: Easing.in(Easing.cubic),
      });
      slideY.value = withTiming(traumaSafeMode ? 12 : 50, {
        duration: traumaSafeMode ? 180 : 250,
        easing: Easing.in(Easing.cubic),
      });

      // Close sheet
      bottomSheetRef.current?.close();
    }
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [visible, title, fadeOpacity, slideY, impact, focus, traumaSafeMode]);

  // Handle sheet snap point changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Sheet closed
        onClose();
        if (!traumaSafeMode) {
          impact('light');
        }
      } else if (index > 0) {
        // Snap point changed
        if (!traumaSafeMode) {
          impact('light');
        }
      }

      if (onAnimate) {
        onAnimate(-1, index);
      }
    },
    [onClose, onAnimate, impact, traumaSafeMode],
  );

  // Handle close button press
  const handleClose = useCallback(() => {
    if (!traumaSafeMode) {
      impact('light');
    }
    onClose();
    bottomSheetRef.current?.close();
  }, [impact, onClose, traumaSafeMode]);

  // Calculate responsive padding
  const headerPaddingHorizontal = scaleSpacing(isTablet ? SPACING.xl : SPACING.base);
  const headerPaddingVertical = scaleSpacing(SPACING.base);
  const contentPaddingValue = scaleSpacing(isTablet ? SPACING.xl : SPACING.base);
  const bottomPadding = Math.max(insets.bottom, scaleSpacing(SPACING.base));

  // Responsive font sizes
  const titleFontSize = scaleFont(18, 0.3);
  const iconSize = scaleFont(24, 0.3);

  // Theme-based styles
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: scaleSpacing(SPACING.xl),
    },
    android: {
      elevation: 16,
    },
  });

  if (!visible) return null;

  const closeButtonAccessibility = getButtonAccessibility(
    ACCESSIBILITY_LABELS.closeButton,
    ACCESSIBILITY_HINTS.closeButton,
  );

  return (
    <Animated.View style={[styles.container, animatedSheetStyle]} pointerEvents="auto">
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        style={[styles.backdrop, { backgroundColor: theme.colors.overlayLight }]}
        accessibilityLabel={ACCESSIBILITY_LABELS.closeButton}
      />
      <View style={styles.sheetContainer}>
        <BottomSheetLib
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          enablePanDownToClose={enablePanDownToClose}
          enableOverDrag={enableOverDrag}
          backgroundStyle={[
            styles.background,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
            },
            shadowStyle,
          ]}
          handleIndicatorStyle={{
            backgroundColor: theme.colors.border2,
            width: scaleSpacing(SPACING.xxl),
            height: scaleSpacing(SPACING.xs),
          }}
          style={styles.sheet}
          bottomInset={insets.bottom}
          android_keyboardInputMode="adjustResize"
        >
          {(title || showCloseButton) && (
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: theme.colors.border2,
                  borderBottomWidth: 1,
                  paddingHorizontal: headerPaddingHorizontal,
                  paddingTop: headerPaddingVertical,
                  paddingBottom: scaleSpacing(SPACING.md),
                },
              ]}
              accessibilityRole={ACCESSIBILITY_ROLES.header}
            >
              {title && (
                <View style={styles.titleContainer} ref={focusRef}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: theme.colors.text,
                        fontSize: titleFontSize,
                        fontWeight: '600',
                      },
                    ]}
                    accessibilityRole={ACCESSIBILITY_ROLES.header}
                    accessibilityLabel={title}
                  >
                    {title}
                  </Text>
                </View>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  onPress={handleClose}
                  style={[
                    styles.closeButton,
                    {
                      padding: scaleSpacing(SPACING.xs),
                      borderRadius: theme.radius.md,
                    },
                  ]}
                  activeOpacity={0.7}
                  {...closeButtonAccessibility}
                >
                  <Ionicons name="close" size={iconSize} color={theme.colors.text2} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View
            style={[
              styles.content,
              {
                paddingHorizontal: contentPaddingValue,
                paddingTop: scaleSpacing(SPACING.base),
                paddingBottom: bottomPadding,
              },
            ]}
          >
            {children}
          </View>
        </BottomSheetLib>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    flex: 1,
    zIndex: 1,
  },
  sheet: {
    // Sheet styles handled by library
  },
  background: {
    // Background styles applied via backgroundStyle prop
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    // Font size and color applied inline for responsiveness
  },
  closeButton: {
    // Padding and border radius applied inline for responsiveness
  },
  content: {
    flex: 1,
    // Padding applied inline for responsiveness
  },
});
