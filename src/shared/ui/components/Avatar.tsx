/**
 * Avatar Component
 *
 * Reusable avatar component for displaying user profile pictures.
 * Supports fallback to initials or default image.
 * Uses the shared app theme.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { getInitials } from '@/src/shared/utils/format';
import React from 'react';
import { Image, ImageURISource, StyleSheet, Text, View } from 'react-native';

export interface AvatarProps {
  uri?: string | null;
  size?: number;
  name?: string;
  defaultSource?: ImageURISource | number;
}

const AvatarComponent: React.FC<AvatarProps> = ({ uri, size = 48, name, defaultSource }) => {
  const { theme } = useTheme();

  const avatarUri = typeof uri === 'string' && uri.trim().length > 0 ? uri.trim() : null;
  const initials = name ? getInitials(name) : '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.input,
        },
      ]}
    >
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          resizeMode="cover"
          defaultSource={defaultSource}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.4,
              color: theme.colors.text2,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
  initials: {
    fontWeight: '700',
  },
});

const Avatar = React.memo(AvatarComponent);
Avatar.displayName = 'Avatar';

export default Avatar;
