/**
 * Caption Component
 *
 * Thin wrapper around the shared text primitive.
 */

import React from 'react';
import BaseText, { TextProps as BaseTextProps } from '../primitives/Text';

export type CaptionProps = Omit<BaseTextProps, 'variant'>;

const Caption: React.FC<CaptionProps> = (props) => <BaseText variant="caption" {...props} />;

export default Caption;
