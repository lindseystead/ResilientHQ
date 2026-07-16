/**
 * Help Screen
 *
 * Unified layout system with standard spacing.
 * Includes working tutorials, grounding mode, and crisis resources.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, Alert, Linking, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ProtectedScreen, Card, Section, Title, Body, Button, BottomSheet } from '@/src/shared/ui';
import { resolveCrisisSupportRouting } from '@/src/domains/ai/safetyContext';
import {
  AccordionItem,
  BreathingExercise,
  GroundingExercise,
  QuickActionCard,
  TutorialCard,
} from '../components';
import {
  BREATHING_STEPS,
  GROUNDING_STEPS,
  HELP_FAQS,
  HELP_TUTORIALS,
  SUPPORT_EMAIL,
} from '../constants';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive } from '@/src/shared/utils/responsive';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CrisisActionRow {
  label: string;
  url: string;
  icon: IoniconName;
}

const HelpScreen: React.FC = () => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedTutorial, setExpandedTutorial] = useState<number | null>(null);
  const [showGroundingModal, setShowGroundingModal] = useState(false);
  const [groundingMode, setGroundingMode] = useState<'breathing' | 'grounding' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Locale/country-aware crisis resources, resolved from the device context —
  // the same routing the in-chat crisis sheet uses, so both stay consistent.
  const crisisResources = useMemo(() => {
    const routing = resolveCrisisSupportRouting();
    const actions: CrisisActionRow[] = [];

    if (routing.primaryCallAction) {
      actions.push({ ...routing.primaryCallAction, icon: 'call-outline' });
    }
    if (routing.primaryTextAction) {
      actions.push({ ...routing.primaryTextAction, icon: 'chatbubble-ellipses-outline' });
    }
    if (routing.emergencyAction) {
      actions.push({ ...routing.emergencyAction, icon: 'alert-circle-outline' });
    }
    actions.push({ ...routing.directoryAction, icon: 'globe-outline' });

    return { guidance: routing.bodyText, actions };
  }, []);

  const handleQuickAction = (action: string) => {
    impact('light');

    switch (action) {
      case 'faq':
        // FAQ is the first section, just scroll up
        break;
      case 'contact':
        Alert.alert('Contact Support', `For support, please email us at ${SUPPORT_EMAIL}`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Email',
            onPress: () => {
              Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
            },
          },
        ]);
        break;
      case 'tutorials':
        // Expand the first tutorial
        setExpandedTutorial(expandedTutorial === 0 ? null : 0);
        break;
      case 'safety':
        setGroundingMode('breathing');
        setCurrentStep(0);
        setShowGroundingModal(true);
        break;
    }
  };

  const handleTutorialPress = (index: number) => {
    impact('medium');
    setExpandedTutorial(expandedTutorial === index ? null : index);
  };

  const handleStartGrounding = useCallback(
    (mode: 'breathing' | 'grounding') => {
      impact('medium');
      setGroundingMode(mode);
      setCurrentStep(0);
      setShowGroundingModal(true);
    },
    [impact],
  );

  const toggleFAQ = (index: number) => {
    impact('light');
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <ProtectedScreen
      title="Help & Support"
      subtitle="Find answers and get the support you need"
      requireAuth={false}
    >
      {/* Quick Actions */}
      <Section title="Quick Actions">
        <View style={styles.quickActionsContainer}>
          <QuickActionCard
            icon="information-circle-outline"
            label="FAQ"
            onPress={() => handleQuickAction('faq')}
          />
          <QuickActionCard
            icon="chatbubble-ellipses-outline"
            label="Contact Support"
            onPress={() => handleQuickAction('contact')}
          />
          <QuickActionCard
            icon="book-outline"
            label="Tutorials"
            onPress={() => handleQuickAction('tutorials')}
          />
          <QuickActionCard
            icon="shield-checkmark-outline"
            label="Safety Tools"
            onPress={() => handleQuickAction('safety')}
          />
        </View>
      </Section>

      {/* FAQ Section */}
      <Section title="Frequently Asked Questions">
        {HELP_FAQS.map((item, index) => (
          <AccordionItem
            key={index}
            question={item.question}
            answer={item.answer}
            isExpanded={expandedFAQ === index}
            onToggle={() => toggleFAQ(index)}
          />
        ))}
      </Section>

      {/* Tutorials Section */}
      <Section title="Tutorials">
        {HELP_TUTORIALS.map((tutorial, index) => (
          <View key={index}>
            <TutorialCard
              icon={tutorial.icon}
              title={tutorial.title}
              description={tutorial.description}
              onPress={() => handleTutorialPress(index)}
            />
            {expandedTutorial === index && (
              <Card>
                {tutorial.steps.map((step, stepIndex) => (
                  <View
                    key={stepIndex}
                    style={[
                      styles.tutorialStep,
                      {
                        paddingVertical: scaleSpacing(theme.spacing.md),
                        borderBottomColor: theme.colors.border2,
                        borderBottomWidth: stepIndex < tutorial.steps.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepTitle,
                        {
                          color: theme.colors.text,
                          fontSize: scaleFont(14, 0.3),
                          marginBottom: scaleSpacing(theme.spacing.xs),
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text
                      style={[
                        styles.stepContent,
                        {
                          color: theme.colors.text2,
                          fontSize: scaleFont(13, 0.3),
                        },
                      ]}
                    >
                      {step.content}
                    </Text>
                  </View>
                ))}
              </Card>
            )}
          </View>
        ))}
      </Section>

      {/* Safety & Grounding Tools */}
      <Section title="Safety & Grounding Tools">
        <Card>
          <Body
            style={{
              fontSize: scaleFont(15, 0.3),
              marginBottom: scaleSpacing(theme.spacing.lg),
            }}
          >
            Use these tools to help manage moments of distress and find calm.
          </Body>
          <View style={styles.groundingButtons}>
            <Button
              title="Breathing Exercise"
              onPress={() => handleStartGrounding('breathing')}
              variant="primary"
              fullWidth
            />
            <View style={{ height: scaleSpacing(theme.spacing.sm) }} />
            <Button
              title="5-4-3-2-1 Grounding"
              onPress={() => handleStartGrounding('grounding')}
              variant="outline"
              fullWidth
            />
          </View>
        </Card>

        {/* Crisis Resources */}
        <Card>
          <View style={styles.crisisHeader}>
            <Ionicons
              name="warning-outline"
              size={scaleFont(20, 0.3)}
              color={theme.colors.primary}
            />
            <Title
              style={{
                fontSize: scaleFont(16, 0.3),
                marginLeft: scaleSpacing(theme.spacing.sm),
              }}
            >
              Crisis Resources
            </Title>
          </View>
          <Body
            style={{
              fontSize: scaleFont(13, 0.3),
              marginBottom: scaleSpacing(theme.spacing.md),
            }}
          >
            ResilientHQ is not an emergency service. If you or someone you know is in immediate
            danger, please contact your local emergency services or use these resources.{' '}
            {crisisResources.guidance}
          </Body>
          {crisisResources.actions.map((resource, index) => (
            <TouchableOpacity
              key={resource.label}
              onPress={() => Linking.openURL(resource.url)}
              style={[
                styles.crisisLink,
                {
                  borderBottomColor: theme.colors.border2,
                  borderBottomWidth: index < crisisResources.actions.length - 1 ? 1 : 0,
                },
              ]}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel={resource.label}
            >
              <Ionicons
                name={resource.icon}
                size={scaleFont(18, 0.3)}
                color={theme.colors.primary}
              />
              <View style={styles.crisisLinkText}>
                <Text
                  style={[
                    styles.crisisTitle,
                    { color: theme.colors.text, fontSize: scaleFont(14, 0.3) },
                  ]}
                >
                  {resource.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      </Section>

      {/* Footer Contact Block */}
      <View
        style={[
          styles.footerSection,
          {
            borderTopColor: theme.colors.border2,
            paddingVertical: scaleSpacing(theme.spacing['2xl']),
          },
        ]}
      >
        <Ionicons name="mail-outline" size={scaleFont(24, 0.3)} color={theme.colors.primary} />
        <Body
          style={{
            marginTop: scaleSpacing(theme.spacing.md),
            marginBottom: scaleSpacing(theme.spacing.sm),
          }}
        >
          Need more help?
        </Body>
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          activeOpacity={0.7}
        >
          <Body style={{ color: theme.colors.primary, textDecorationLine: 'underline' }}>
            {SUPPORT_EMAIL}
          </Body>
        </TouchableOpacity>
      </View>

      {/* Grounding Mode Bottom Sheet */}
      <BottomSheet
        visible={showGroundingModal}
        onClose={() => {
          setShowGroundingModal(false);
          setGroundingMode(null);
          setCurrentStep(0);
        }}
        title={groundingMode === 'breathing' ? 'Breathing Exercise' : '5-4-3-2-1 Grounding'}
        snapPoints={['60%']}
      >
        {groundingMode === 'breathing' ? (
          <BreathingExercise
            currentStep={currentStep}
            onStepComplete={() => setCurrentStep((prev) => (prev + 1) % BREATHING_STEPS.length)}
          />
        ) : (
          <GroundingExercise
            currentStep={currentStep}
            onStepComplete={() =>
              setCurrentStep((prev) => {
                if (prev < GROUNDING_STEPS.length - 1) return prev + 1;
                return prev;
              })
            }
            onComplete={() => {
              setShowGroundingModal(false);
              setGroundingMode(null);
              setCurrentStep(0);
            }}
          />
        )}
      </BottomSheet>
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  footerSection: {
    alignItems: 'center',
    borderTopWidth: 1,
  },
  tutorialStep: {
    // Padding and border applied inline
  },
  stepTitle: {
    fontWeight: '600',
  },
  stepContent: {
    lineHeight: 20,
  },
  groundingButtons: {
    // Layout managed by children
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  crisisLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  crisisLinkText: {
    flex: 1,
  },
  crisisTitle: {
    fontWeight: '600',
  },
});

export default HelpScreen;
