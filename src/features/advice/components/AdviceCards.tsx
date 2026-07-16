/**
 * Advice feature card components
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Body, Card, Title } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { ResilienceResource, WellnessTip } from '@/src/domains/wellbeing';

interface AdviceTipCardProps {
  tip: WellnessTip;
}

interface AdviceResourceItemProps {
  item: ResilienceResource;
  onPress: (url: string) => void;
}

const AdviceTipCardComponent: React.FC<AdviceTipCardProps> = ({ tip }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <Card>
      <View style={styles.tipCard}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: theme.colors.primary + '20',
              width: scaleSpacing(48),
              height: scaleSpacing(48),
              borderRadius: scaleSpacing(24),
              marginRight: scaleSpacing(theme.spacing.md),
            },
          ]}
        >
          <Ionicons
            name={tip.icon as keyof typeof Ionicons.glyphMap}
            size={scaleFont(28, 0.3)}
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.cardContent}>
          <Title
            style={{ fontSize: scaleFont(18, 0.3), marginBottom: scaleSpacing(theme.spacing.xs) }}
          >
            {tip.title}
          </Title>
          <Body style={{ fontSize: scaleFont(15, 0.3) }}>{tip.description}</Body>
        </View>
      </View>
    </Card>
  );
};

const AdviceResourceItemComponent: React.FC<AdviceResourceItemProps> = ({ item, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => onPress(item.url)}
      style={[styles.articleContainer, { borderBottomColor: theme.colors.border2 }]}
      activeOpacity={0.7}
    >
      <Ionicons name="open-outline" size={20} color={theme.colors.primary} />
      <View style={styles.resourceTextGroup}>
        <Body style={{ color: theme.colors.primary }}>{item.title}</Body>
        <Body muted style={styles.resourceDescription}>
          {item.description}
        </Body>
        <Body muted style={styles.resourceSource}>
          {item.source}
        </Body>
      </View>
    </TouchableOpacity>
  );
};

export const AdviceTipCard = React.memo(AdviceTipCardComponent);
export const AdviceResourceItem = React.memo(AdviceResourceItemComponent);

const styles = StyleSheet.create({
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  articleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  resourceTextGroup: {
    flex: 1,
    marginLeft: 12,
  },
  resourceDescription: {
    marginTop: 2,
    lineHeight: 20,
  },
  resourceSource: {
    marginTop: 2,
    fontWeight: '600',
  },
});
