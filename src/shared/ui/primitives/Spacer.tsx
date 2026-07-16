/**
 * Spacer Component
 *
 * Simple spacing utility component.
 */

import React, { memo } from 'react';
import { View } from 'react-native';

export interface SpacerProps {
  /** Equal spacing (used for both height and width if neither specified) */
  size?: number;
  /** Vertical space */
  height?: number;
  /** Horizontal space */
  width?: number;
}

const Spacer: React.FC<SpacerProps> = memo(({ size, height, width }) => (
  <View style={{ height: height ?? size ?? 0, width: width ?? 0 }} />
));

Spacer.displayName = 'Spacer';
export default Spacer;
