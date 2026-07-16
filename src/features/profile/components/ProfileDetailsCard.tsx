/**
 * Profile Details Card Component
 *
 * Displays personal information in a clean, organized card.
 */

import React from 'react';
import Animated from 'react-native-reanimated';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { Card, DetailRow, SectionTitle, Button } from '@/src/shared/ui';

export interface ProfileDetailsCardProps {
  name: string;
  email: string;
  age?: string;
  location?: string;
  bio?: string;
  onEditPress: () => void;
}

const ProfileDetailsCard: React.FC<ProfileDetailsCardProps> = ({
  name,
  email,
  age,
  location,
  bio,
  onEditPress,
}) => {
  const { scaleSpacing } = useResponsive();

  const cardAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    delay: 300,
    autoStart: true,
  });

  return (
    <Animated.View style={cardAnimation.animatedStyle}>
      <Card
        variant="elevated"
        padding={scaleSpacing(SPACING.xl)}
        marginBottom={scaleSpacing(SPACING.lg)}
      >
        <SectionTitle>Personal Information</SectionTitle>
        <DetailRow label="Name" value={name} />
        <DetailRow label="Email" value={email} />
        {age && <DetailRow label="Age" value={age} />}
        {location && <DetailRow label="Location" value={location} />}
        {bio && <DetailRow label="Bio" value={bio} />}
        <Button
          title="Edit Profile"
          onPress={onEditPress}
          variant="outline"
          fullWidth
          style={{ marginTop: scaleSpacing(SPACING.md) }}
        />
      </Card>
    </Animated.View>
  );
};

export default ProfileDetailsCard;
