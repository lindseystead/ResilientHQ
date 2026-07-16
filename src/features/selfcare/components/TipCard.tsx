/**
 * Tip Card Component
 *
 * Displays a single self-care tip with icon and text.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import { Card, TipItem } from '@/src/shared/ui';
import * as Haptics from 'expo-haptics';

interface TipCardProps {
  tip: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TipCard: React.FC<TipCardProps> = ({ tip, icon }) => {
  const { theme } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      // Silently fail if haptics are blocked or unavailable
    });
    Alert.alert('Self-Care Tip', tip);
  };

  return (
    <Card>
      <TouchableOpacity
        style={[styles.tipCard, { borderColor: theme.colors.border2 }]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel={`Self-care tip: ${tip}`}
        accessibilityHint="Tap to view the full tip"
      >
        <TipItem icon={icon} text={tip} />
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    // padding handled by Card component
    borderWidth: 0, // Remove border as Card handles it
  },
});

export default TipCard;
