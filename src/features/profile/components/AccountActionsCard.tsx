/**
 * Account Actions Card Component
 *
 * Account management actions: logout, delete account, etc.
 */

import React from 'react';
import { Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { Card, SectionTitle, Button } from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';

export interface AccountActionsCardProps {
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onExportData?: () => void;
  onExportChatHistory?: () => void;
}

const AccountActionsCard: React.FC<AccountActionsCardProps> = ({
  onLogout,
  onDeleteAccount,
  onExportData,
  onExportChatHistory,
}) => {
  const { scaleSpacing } = useResponsive();

  const cardAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    delay: 500,
    autoStart: true,
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDeleteAccount,
        },
      ],
    );
  };

  return (
    <Animated.View style={cardAnimation.animatedStyle}>
      <Card
        variant="elevated"
        padding={scaleSpacing(SPACING.xl)}
        marginBottom={scaleSpacing(SPACING.lg)}
      >
        <SectionTitle>Account Actions</SectionTitle>

        {onExportData && (
          <Button
            title="Export My Data"
            onPress={onExportData}
            variant="outline"
            icon="download-outline"
            fullWidth
            style={{ marginBottom: scaleSpacing(SPACING.md) }}
          />
        )}

        {onExportChatHistory && (
          <Button
            title="Export Chat History"
            onPress={onExportChatHistory}
            variant="outline"
            icon="chatbubble-ellipses-outline"
            fullWidth
            style={{ marginBottom: scaleSpacing(SPACING.md) }}
          />
        )}

        <Button
          title={TEXT.signOut}
          onPress={onLogout}
          variant="danger"
          icon="log-out-outline"
          fullWidth
          style={{ marginBottom: scaleSpacing(SPACING.md) }}
        />

        {onDeleteAccount && (
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="danger"
            icon="trash-outline"
            fullWidth
          />
        )}
      </Card>
    </Animated.View>
  );
};

export default AccountActionsCard;
