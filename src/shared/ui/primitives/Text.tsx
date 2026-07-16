/**
 * Text Component
 *
 * Canonical typography primitive for the shared UI layer.
 * All higher-level text wrappers should compose this component.
 */

import React, { forwardRef, memo } from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, fontWeight } from '@/src/config/theme';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodyLarge' | 'label' | 'caption';

export interface TextProps extends RNTextProps {
  /** Typography variant */
  variant?: TextVariant;
  /** Use secondary (muted) color */
  muted?: boolean;
  /** Custom color override */
  color?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Font weight override */
  weight?: '400' | '500' | '600' | '700' | '800';
}

const STYLES: Record<TextVariant, { fontSize: number; fontWeight: string; lineHeight: number }> = {
  h1: { fontSize: font.h1, fontWeight: fontWeight.extrabold, lineHeight: 40 },
  h2: { fontSize: font.h2, fontWeight: fontWeight.bold, lineHeight: 36 },
  h3: { fontSize: font.h3, fontWeight: fontWeight.bold, lineHeight: 32 },
  h4: { fontSize: font.h4, fontWeight: fontWeight.semibold, lineHeight: 28 },
  body: { fontSize: font.body, fontWeight: fontWeight.normal, lineHeight: 24 },
  bodyLarge: { fontSize: font.bodyLarge, fontWeight: fontWeight.normal, lineHeight: 28 },
  label: { fontSize: font.label, fontWeight: fontWeight.semibold, lineHeight: 20 },
  caption: { fontSize: font.caption, fontWeight: fontWeight.normal, lineHeight: 16 },
};

type NativeTextRef = React.ComponentRef<typeof RNText>;

const BaseText = forwardRef<NativeTextRef, TextProps>(
  (
    { children, variant = 'body', muted = false, color, align = 'left', weight, style, ...props },
    ref,
  ) => {
    const { theme } = useTheme();
    const variantStyle = STYLES[variant];

    return (
      <RNText
        ref={ref}
        style={[
          {
            fontSize: variantStyle.fontSize,
            fontWeight: (weight ?? variantStyle.fontWeight) as TextProps['weight'],
            lineHeight: variantStyle.lineHeight,
            color: color ?? (muted ? theme.colors.text2 : theme.colors.text),
            textAlign: align,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </RNText>
    );
  },
);

BaseText.displayName = 'BaseText';

const Text = memo(BaseText);

Text.displayName = 'Text';
export default Text;
