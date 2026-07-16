import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';

const AppBackdrop: React.FC = () => {
  const { theme } = useTheme();
  const { contentWidth, scaleSpacing } = useResponsive();

  const orbSize = Math.max(scaleSpacing(180), Math.min(contentWidth * 0.48, scaleSpacing(280)));
  const secondaryOrbSize = Math.max(
    scaleSpacing(140),
    Math.min(contentWidth * 0.34, scaleSpacing(220)),
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={theme.colors.canvasGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.orb,
          {
            width: orbSize,
            height: orbSize,
            borderRadius: orbSize / 2,
            backgroundColor: theme.colors.ambientPrimary,
            top: scaleSpacing(-48),
            right: scaleSpacing(-68),
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            width: secondaryOrbSize,
            height: secondaryOrbSize,
            borderRadius: secondaryOrbSize / 2,
            backgroundColor: theme.colors.ambientSecondary,
            top: scaleSpacing(120),
            left: scaleSpacing(-54),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
});

export default AppBackdrop;
