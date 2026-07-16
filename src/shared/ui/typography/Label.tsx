/**
 * Label Component
 *
 * Thin wrapper around the shared text primitive.
 */

import React from 'react';
import BaseText, { TextProps as BaseTextProps } from '../primitives/Text';

export type LabelProps = Omit<BaseTextProps, 'variant'>;

const Label: React.FC<LabelProps> = (props) => <BaseText variant="label" {...props} />;

export default Label;
