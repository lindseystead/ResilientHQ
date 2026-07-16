/**
 * Title Component
 *
 * Thin wrapper around the shared text primitive.
 */

import React from 'react';
import BaseText, { TextProps as BaseTextProps } from '../primitives/Text';

export type TitleProps = Omit<BaseTextProps, 'variant'>;

const Title: React.FC<TitleProps> = (props) => <BaseText variant="h2" {...props} />;

export default Title;
