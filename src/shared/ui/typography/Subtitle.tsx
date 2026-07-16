/**
 * Subtitle Component
 *
 * Thin wrapper around the shared text primitive.
 */

import React from 'react';
import BaseText, { TextProps as BaseTextProps } from '../primitives/Text';

export type SubtitleProps = Omit<BaseTextProps, 'variant'>;

const Subtitle: React.FC<SubtitleProps> = ({ muted, ...props }) => (
  <BaseText variant="body" muted={muted ?? true} {...props} />
);

export default Subtitle;
