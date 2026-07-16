/**
 * Icon Component
 *
 * Wrapper around Ionicons with theme integration.
 */

import React, { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';

export interface IconProps {
  /** Ionicons icon name */
  name: keyof typeof Ionicons.glyphMap;
  /** Icon size (default: 24) */
  size?: number;
  /** Icon color (defaults to theme.colors.text) */
  color?: string;
  /** Use muted color */
  muted?: boolean;
}

const Icon: React.FC<IconProps> = memo(({ name, size = 24, color, muted = false }) => {
  const { theme } = useTheme();
  const iconColor = color ?? (muted ? theme.colors.text2 : theme.colors.text);

  return <Ionicons name={name} size={size} color={iconColor} />;
});

Icon.displayName = 'Icon';
export default Icon;
