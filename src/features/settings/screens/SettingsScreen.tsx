/**
 * Settings Screen
 *
 * Unified layout system with standard spacing.
 */

import { Body, Button, ProtectedScreen } from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';
import { font } from '@/src/config/theme';
import { useAuth, useErrorHandler, useTheme } from '@/src/shared/hooks';
import {
  ReminderPreviewCard,
  SettingsActionRow,
  SettingsRow,
  SettingsSection,
  SettingsSwitchRow,
  SettingsValueRow,
} from '../components';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import { useAISettings } from '@/src/providers/AISettingsProvider';
import { useAppSecurity } from '@/src/providers/AppSecurityProvider';
import { useTraumaSafeMode } from '@/src/providers/TraumaSafeModeProvider';
import {
  AppSettings,
  AppearanceSettings,
  NotificationSettings,
  PrivacySettings,
} from '@/src/types/settings';
import { formatDeviceInfo, getAppInfo } from '@/src/shared/utils/debug';
import { testAIService, testBiometric, testNotification } from '@/src/shared/utils/debug/testUtils';
import { useResponsive } from '@/src/shared/utils/responsive';
import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';
import { useAdaptiveReminderPlan, useSettingsActions } from '../hooks';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

const SettingsScreen: React.FC = () => {
  const handleError = useErrorHandler();
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();
  const { impact, notification } = useHaptics();
  const {
    settings: securitySettings,
    updateSettings: updateSecurity,
    isBiometricAvailable,
  } = useAppSecurity();
  const { settings: aiSettings, updateSettings: updateAI } = useAISettings();
  const { scaleFont, scaleSpacing, insets } = useResponsive();
  const { updateTraumaSafeMode } = useTraumaSafeMode();
  const contentBottomPadding =
    TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(theme.spacing.sm));

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const showDebug = __DEV__;
  const { plan: reminderPlan, isLoading: isReminderPreviewLoading } = useAdaptiveReminderPlan(
    settings?.notifications ?? null,
  );
  const {
    isExporting,
    isExportingChat,
    isClearingChatHistory,
    isSyncing,
    lastSyncTime,
    handleClearCache,
    handleClearChatHistory,
    handleClearQueue,
    handleDeleteAccount,
    handleExportChatHistory,
    handleExportData,
    handleForceSync,
    handleLogout,
  } = useSettingsActions({
    user,
    signOut,
    handleError,
    impact,
    notification,
  });

  const loadSettings = useCallback(async () => {
    try {
      const appSettings = await UserPreferencesStorage.loadSettings();
      setSettings(appSettings);
    } catch (error) {
      handleError(error, { context: 'Loading settings', showAlert: false });
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Load settings on mount
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateAppearance = async (updates: Partial<AppearanceSettings>) => {
    if (!settings) return;
    const newAppearance = { ...settings.appearance, ...updates };
    const newSettings = { ...settings, appearance: newAppearance };
    setSettings(newSettings);
    await UserPreferencesStorage.updateSettings({ appearance: newAppearance });

    if (typeof updates.traumaSafeMode === 'boolean') {
      await updateTraumaSafeMode(updates.traumaSafeMode, { persist: false });
    }

    if (updates.theme) {
      if (updates.theme === 'system') {
        setTheme(null);
      } else {
        setTheme(updates.theme);
      }
    }
  };

  const updateNotifications = async (updates: Partial<NotificationSettings>) => {
    if (!settings) return;
    const newNotifications = { ...settings.notifications, ...updates };
    const newSettings = { ...settings, notifications: newNotifications };
    setSettings(newSettings);
    await UserPreferencesStorage.updateSettings({ notifications: newNotifications });
  };

  const updatePrivacy = async (updates: Partial<PrivacySettings>) => {
    if (!settings) return;
    const newPrivacy = { ...settings.privacy, ...updates };
    const newSettings = { ...settings, privacy: newPrivacy };
    setSettings(newSettings);
    await UserPreferencesStorage.updateSettings({ privacy: newPrivacy });
  };

  if (isLoading || !settings) {
    return (
      <ProtectedScreen title={TEXT.settings} requireAuth={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ProtectedScreen>
    );
  }

  return (
    <ProtectedScreen
      title={TEXT.settings}
      requireAuth={true}
      scroll={false}
      safeAreaTop={true}
      safeAreaBottom={true}
      includeTabBarPadding={false}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            padding: scaleSpacing(theme.spacing.lg),
            paddingBottom: contentBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        accessible={true}
        accessibilityLabel="Settings content"
      >
        {/* Account Card */}
        <SettingsSection title="Account">
          <SettingsRow
            label="Logged in as"
            rightComponent={
              <Body
                style={[
                  styles.optionValue,
                  {
                    color: theme.colors.secondary,
                    marginLeft: scaleSpacing(theme.spacing.md),
                  },
                ]}
              >
                {user?.email || 'Not logged in'}
              </Body>
            }
          />
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance">
          <SettingsRow
            label="Theme"
            rightComponent={
              <View
                style={[
                  styles.selectorContainer,
                  {
                    gap: scaleSpacing(theme.spacing.sm),
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    {
                      paddingHorizontal: scaleSpacing(theme.spacing.md),
                      paddingVertical: scaleSpacing(theme.spacing.xs),
                      borderRadius: theme.radius.sm,
                      ...(settings.appearance.theme === 'light' && {
                        backgroundColor: theme.colors.primary + '20',
                      }),
                    },
                  ]}
                  onPress={() => updateAppearance({ theme: 'light' })}
                >
                  <Body
                    style={[
                      styles.selectorText,
                      {
                        fontSize: scaleFont(font.label, 0.3),
                        ...(settings.appearance.theme === 'light' && {
                          color: theme.colors.primary,
                          fontWeight: '600',
                        }),
                      },
                    ]}
                  >
                    Light
                  </Body>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    {
                      paddingHorizontal: scaleSpacing(theme.spacing.md),
                      paddingVertical: scaleSpacing(theme.spacing.xs),
                      borderRadius: theme.radius.sm,
                      ...(settings.appearance.theme === 'dark' && {
                        backgroundColor: theme.colors.primary + '20',
                      }),
                    },
                  ]}
                  onPress={() => updateAppearance({ theme: 'dark' })}
                >
                  <Body
                    style={[
                      styles.selectorText,
                      {
                        fontSize: scaleFont(font.label, 0.3),
                        ...(settings.appearance.theme === 'dark' && {
                          color: theme.colors.primary,
                          fontWeight: '600',
                        }),
                      },
                    ]}
                  >
                    Dark
                  </Body>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.selectorButton,
                    {
                      paddingHorizontal: scaleSpacing(theme.spacing.md),
                      paddingVertical: scaleSpacing(theme.spacing.xs),
                      borderRadius: theme.radius.sm,
                      ...(settings.appearance.theme === 'system' && {
                        backgroundColor: theme.colors.primary + '20',
                      }),
                    },
                  ]}
                  onPress={() => updateAppearance({ theme: 'system' })}
                >
                  <Body
                    style={[
                      styles.selectorText,
                      {
                        fontSize: scaleFont(font.label, 0.3),
                        ...(settings.appearance.theme === 'system' && {
                          color: theme.colors.primary,
                          fontWeight: '600',
                        }),
                      },
                    ]}
                  >
                    System
                  </Body>
                </TouchableOpacity>
              </View>
            }
          />
          <SettingsSwitchRow
            label="Reduce Motion"
            description="Reduce animations for accessibility"
            value={settings.appearance.reduceMotion}
            onValueChange={(value) => updateAppearance({ reduceMotion: value })}
            showDivider
          />
          <SettingsSwitchRow
            label="Trauma-Safe Mode"
            description="Use calmer copy and more predictable motion during stressful moments"
            value={settings.appearance.traumaSafeMode}
            onValueChange={(value) => updateAppearance({ traumaSafeMode: value })}
            showDivider
          />
          <SettingsValueRow
            label="Font Size"
            value={settings.appearance.fontSize.replace(/([A-Z])/g, ' $1').trim()}
            onPress={() => {
              const sizes: ('small' | 'medium' | 'large' | 'extraLarge')[] = [
                'small',
                'medium',
                'large',
                'extraLarge',
              ];
              const currentIndex = sizes.indexOf(settings.appearance.fontSize);
              const nextIndex = (currentIndex + 1) % sizes.length;
              updateAppearance({ fontSize: sizes[nextIndex] });
            }}
            showDivider
          />
          <SettingsSwitchRow
            label="High Contrast"
            description="Increase contrast for better visibility"
            value={settings.appearance.highContrast}
            onValueChange={(value) => updateAppearance({ highContrast: value })}
          />
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection title="Security">
          <SettingsSwitchRow
            label="Biometric Unlock"
            description={
              isBiometricAvailable
                ? 'Use Face ID or Touch ID to unlock'
                : 'Biometric authentication not available'
            }
            value={securitySettings.biometricEnabled}
            onValueChange={(value) => updateSecurity({ biometricEnabled: value })}
            disabled={!isBiometricAvailable}
            showDivider
          />
          <SettingsSwitchRow
            label="Require Auth on Open"
            description={
              isBiometricAvailable && securitySettings.biometricEnabled
                ? 'Require biometric unlock when app opens'
                : 'Enable biometric unlock to use this'
            }
            value={securitySettings.requireAuthOnOpen}
            onValueChange={(value) => updateSecurity({ requireAuthOnOpen: value })}
            disabled={!isBiometricAvailable || !securitySettings.biometricEnabled}
            showDivider
          />
          <SettingsSwitchRow
            label="Blur Screen on Background"
            description="Hide sensitive content when app is in background"
            value={securitySettings.blurScreenOnBackground}
            onValueChange={(value) => updateSecurity({ blurScreenOnBackground: value })}
            showDivider
          />
          <SettingsSwitchRow
            label="Prevent Screenshots"
            description="Block screenshots on sensitive screens"
            value={securitySettings.preventScreenshots}
            onValueChange={(value) => updateSecurity({ preventScreenshots: value })}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications">
          <SettingsSwitchRow
            label="Enable Notifications"
            value={settings.notifications.enabled}
            onValueChange={(value) => updateNotifications({ enabled: value })}
            showDivider
          />
          <SettingsSwitchRow
            label="Mood Check-in Reminders"
            value={settings.notifications.moodCheckInReminders}
            onValueChange={(value) => updateNotifications({ moodCheckInReminders: value })}
            disabled={!settings.notifications.enabled}
            showDivider
          />
          <SettingsSwitchRow
            label="Journaling Reminders"
            value={settings.notifications.journalingReminders}
            onValueChange={(value) => updateNotifications({ journalingReminders: value })}
            disabled={!settings.notifications.enabled}
            showDivider
          />
          <SettingsSwitchRow
            label="Weekly Reports"
            value={settings.notifications.weeklyReports}
            onValueChange={(value) => updateNotifications({ weeklyReports: value })}
            disabled={!settings.notifications.enabled}
            showDivider
          />
          <SettingsSwitchRow
            label="Community Activity"
            value={settings.notifications.communityActivity}
            onValueChange={(value) => updateNotifications({ communityActivity: value })}
            disabled={!settings.notifications.enabled}
          />
          <ReminderPreviewCard
            isLoading={isReminderPreviewLoading}
            title={reminderPlan.primaryReminder.title}
            summary={reminderPlan.summary}
            body={reminderPlan.primaryReminder.body}
            label={reminderPlan.primaryReminder.label}
            deliveryWindow={reminderPlan.primaryReminder.deliveryWindow}
          />
        </SettingsSection>

        {/* Privacy & Data Section */}
        <SettingsSection title="Privacy & Data">
          <SettingsSwitchRow
            label="Private Profile"
            description="Hide your profile from other users"
            value={settings.privacy.privateProfile}
            onValueChange={(value) => updatePrivacy({ privateProfile: value })}
            showDivider
          />
          <SettingsActionRow
            label="Export Data"
            description="Download all your data"
            onPress={handleExportData}
            isLoading={isExporting}
            showDivider
          />
          <SettingsActionRow
            label="Clear Cache"
            description="Remove cached data"
            onPress={handleClearCache}
            showDivider
          />
          <SettingsActionRow
            label="Clear Offline Queue"
            description="Remove pending operations"
            onPress={handleClearQueue}
            showDivider
          />
          <SettingsActionRow
            label="Force Sync Now"
            description={
              lastSyncTime
                ? `Last sync: ${lastSyncTime.toLocaleTimeString()}`
                : 'Sync pending operations'
            }
            onPress={() => {
              void handleForceSync();
            }}
            isLoading={isSyncing}
            showDivider
          />
          <SettingsActionRow
            label="Delete Account"
            description="Permanently delete your account"
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

        {/* AI Personalization Section */}
        <SettingsSection title="AI Personalization">
          <SettingsValueRow
            label="AI Tone"
            value={aiSettings.tone}
            onPress={() => {
              const tones: ('supportive' | 'direct' | 'professional' | 'coaching')[] = [
                'supportive',
                'direct',
                'professional',
                'coaching',
              ];
              const currentIndex = tones.indexOf(aiSettings.tone);
              const nextIndex = (currentIndex + 1) % tones.length;
              updateAI({ tone: tones[nextIndex] });
            }}
            showDivider
          />
          <SettingsValueRow
            label="Response Length"
            value={aiSettings.responseLength}
            onPress={() => {
              const lengths: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long'];
              const currentIndex = lengths.indexOf(aiSettings.responseLength);
              const nextIndex = (currentIndex + 1) % lengths.length;
              updateAI({ responseLength: lengths[nextIndex] });
            }}
            showDivider
          />
          <SettingsSwitchRow
            label="Journaling Prompts"
            description="Enable AI-powered journaling prompts"
            value={aiSettings.journalingPromptsEnabled}
            onValueChange={(value) => updateAI({ journalingPromptsEnabled: value })}
            showDivider
          />
          <SettingsSwitchRow
            label="Default Chat Memory"
            description="Save new chat messages by default unless you start a private session"
            value={aiSettings.chatMemoryEnabledByDefault}
            onValueChange={(value) => updateAI({ chatMemoryEnabledByDefault: value })}
            showDivider
          />
          <SettingsSwitchRow
            label="Default Prompt Suggestions"
            description="Show suggested prompts and proactive nudges when chat opens"
            value={aiSettings.promptSuggestionsEnabledByDefault}
            onValueChange={(value) => updateAI({ promptSuggestionsEnabledByDefault: value })}
            showDivider
          />
          <SettingsActionRow
            label="Export Saved Chat History"
            description="Download AI conversations stored while chat memory was enabled"
            onPress={handleExportChatHistory}
            isLoading={isExportingChat}
            showDivider
          />
          <SettingsActionRow
            label="Clear Saved Chat History"
            description="Permanently remove saved AI conversation history"
            onPress={handleClearChatHistory}
            isLoading={isClearingChatHistory}
          />
        </SettingsSection>

        {/* Debug & Advanced Section (Development Only) */}
        {showDebug && (
          <SettingsSection title="Debug & Advanced">
            <SettingsRow
              label="App Version"
              rightComponent={
                <Body style={[styles.optionValue, { color: theme.colors.text2 }]}>
                  {getAppInfo().appVersion}
                </Body>
              }
              showDivider
            />
            <SettingsActionRow
              label="Device Info"
              description="View device information"
              onPress={() => Alert.alert('Device Info', formatDeviceInfo())}
              showDivider={Boolean(lastSyncTime)}
            />
            {lastSyncTime && (
              <SettingsRow
                label="Last Sync"
                rightComponent={
                  <Body style={[styles.optionValue, { color: theme.colors.text2 }]}>
                    {lastSyncTime.toLocaleString()}
                  </Body>
                }
                showDivider
              />
            )}
            <SettingsActionRow
              label="Test Biometric"
              description="Test biometric authentication"
              onPress={testBiometric}
              showDivider
            />
            <SettingsActionRow
              label="Test Notification"
              description="Test notification system"
              onPress={() =>
                testNotification({
                  title: reminderPlan.primaryReminder.title,
                  body: reminderPlan.primaryReminder.body,
                })
              }
              showDivider
            />
            <SettingsActionRow
              label="Test AI Service"
              description="Test backend AI connectivity"
              onPress={testAIService}
            />
          </SettingsSection>
        )}

        {/* Logout Button */}
        <Button
          title={TEXT.signOut}
          onPress={handleLogout}
          variant="danger"
          fullWidth
          style={[styles.logoutButton, { marginTop: scaleSpacing(theme.spacing.xl) }]}
        />
      </ScrollView>
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // padding applied inline
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionValue: {
    flex: 1,
    textAlign: 'right',
  },
  selectorContainer: {
    flexDirection: 'row',
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorText: {
    // fontSize applied inline
  },
  logoutButton: {
    // marginTop applied inline
  },
});

export default SettingsScreen;
