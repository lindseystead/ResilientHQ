/**
 * Body Component
 *
 * Thin wrapper around the shared text primitive.
 */

import React from 'react';
import BaseText, { TextProps as BaseTextProps } from '../primitives/Text';

export type BodyProps = Omit<BaseTextProps, 'variant'>;

const Body: React.FC<BodyProps> = (props) => <BaseText variant="body" {...props} />;

export default Body;
