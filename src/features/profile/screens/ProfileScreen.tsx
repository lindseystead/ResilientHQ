/**
 * Profile Screen
 *
 * Unified layout system with standard spacing.
 * Uses ProtectedScreen with scroll={false} for custom scroll implementation.
 */

import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import { useResponsive } from '@/src/shared/utils/responsive';
import * as ImagePicker from 'expo-image-picker';
import { updateEmail, updateProfile } from 'firebase/auth';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { useHaptics } from '@/src/shared/hooks/haptics';
import { useProfileStats } from '../hooks';
import { announceScreenChange, useFocusManagement } from '@/src/shared/utils/accessibility';

import {
  AccountActionsCard,
  EditProfileModal,
  PersonalizationCard,
  PremiumFeaturesCard,
  ProfileDetailsCard,
  ProfileHeader,
  ProfileStats,
} from '../components';
import { ProtectedScreen } from '@/src/shared/ui';

import { TEXT } from '@/src/config/text';
import { FEATURES } from '@/src/config/constants';
import { requestChatCompletion } from '@/src/domains/ai';
import { uploadUserAvatar } from '@/src/services/firebase/storage';
import { DataExporter } from '@/src/shared/utils/data/exporter';

interface UserDetails {
  name: string;
  email: string;
  age?: string;
  location?: string;
  bio?: string;
}

// Calculate self-care score (0-100)
const calculateSelfCareScore = (
  moodLogsCount: number,
  journalEntriesCount: number,
  streakDays: number,
): number => {
  const moodScore = Math.min(moodLogsCount * 10, 40);
  const journalScore = Math.min(journalEntriesCount * 10, 30);
  const streakScore = Math.min(streakDays * 2, 30);
  return Math.min(moodScore + journalScore + streakScore, 100);
};

// Get resilience level and label
const getResilienceLevel = (score: number): { level: number; label: string } => {
  if (score >= 80) return { level: 5, label: 'Thriving' };
  if (score >= 60) return { level: 4, label: 'Flourishing' };
  if (score >= 40) return { level: 3, label: 'Blooming' };
  if (score >= 20) return { level: 2, label: 'Growing' };
  return { level: 1, label: 'Getting Started' };
};

const ProfileScreen: React.FC = () => {
  const handleError = useErrorHandler();
  const { signOut, user, refreshUser } = useAuth();
  const { impact, notification } = useHaptics();
  const { insets, scaleSpacing } = useResponsive();
  const contentBottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(8));

  // State
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    email: '',
    age: '',
    location: '',
    bio: '',
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Stats from hook
  const {
    moodLogsCount,
    journalEntriesCount,
    streakDays,
    aiConversationsCount,
    weeklyProgress,
    isLoading: isLoadingStats,
  } = useProfileStats();

  // Personalization
  const [bioSummary, setBioSummary] = useState<string>('');
  const [isLoadingBio, setIsLoadingBio] = useState(false);

  // Premium
  const [isPremium] = useState(false);

  // Focus management
  const { focus } = useFocusManagement(false);

  // Initialize user details
  useEffect(() => {
    if (user) {
      const displayName = user?.displayName || user?.email?.split('@')[0] || '';
      const email = user?.email || '';
      const photoURL = user?.photoURL || null;

      setUserDetails({
        name: displayName,
        email: email,
        age: '',
        location: '',
        bio: '',
      });

      if (photoURL) {
        setAvatarUri(photoURL);
      }
    }
  }, [user]);

  // Calculate self-care score and resilience level
  const selfCareScore = useMemo(
    () => calculateSelfCareScore(moodLogsCount, journalEntriesCount, streakDays),
    [moodLogsCount, journalEntriesCount, streakDays],
  );

  const { level, label } = useMemo(() => getResilienceLevel(selfCareScore), [selfCareScore]);

  // Announce screen change
  useEffect(() => {
    announceScreenChange('Profile');
    const timer = setTimeout(focus, 500);
    return () => clearTimeout(timer);
  }, [focus]);

  // Handle avatar press
  const handleAvatarPress = useCallback(async () => {
    try {
      impact('light');
      if (!user) return;

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to change your profile picture.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingAvatar(true);
        const asset = result.assets[0];
        const downloadUrl = await uploadUserAvatar(user.uid, asset.uri);
        await updateProfile(user, { photoURL: downloadUrl });
        await refreshUser();
        setAvatarUri(downloadUrl);
        impact('medium');
        notification('success');
      }
    } catch (error) {
      handleError(error, { context: 'Picking profile image' });
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [impact, notification, handleError, user, refreshUser]);

  // Handle edit profile
  const handleEditPress = useCallback(() => {
    setIsEditModalVisible(true);
  }, []);

  // Handle save profile
  const handleSaveProfile = useCallback(
    async (data: UserDetails) => {
      setIsSaving(true);

      try {
        if (user) {
          const nameChanged = data.name !== userDetails.name;
          const emailChanged = data.email !== userDetails.email;

          if (nameChanged) {
            await updateProfile(user, { displayName: data.name });
          }

          if (emailChanged) {
            await updateEmail(user, data.email);
          }
        }

        setUserDetails(data);
        setIsEditModalVisible(false);
        impact('medium');
        notification('success');
        Alert.alert(TEXT.success, 'Profile updated successfully');
      } catch (error) {
        handleError(error, { context: 'Updating profile' });
      } finally {
        setIsSaving(false);
      }
    },
    [user, userDetails, impact, notification, handleError],
  );

  // Handle generate bio
  const handleGenerateBio = useCallback(async () => {
    if (!FEATURES.aiProfileBioEnabled) {
      Alert.alert('AI Disabled', 'AI bio generation is disabled in this build.');
      return;
    }

    if (!user) return;

    setIsLoadingBio(true);
    try {
      const prompt = `Generate a brief, warm, and encouraging bio summary for a mental wellness app user. 
      Include their resilience level (${level} - ${label}) and their wellness journey highlights.
      Keep it under 100 words and make it personal and inspiring.`;

      const response = await requestChatCompletion([
        { role: 'system', content: 'You are a compassionate wellness coach.' },
        { role: 'user', content: prompt },
      ]);

      if (response.content && !response.error) {
        setBioSummary(response.content);
        notification('success');
      } else {
        handleError(new Error('Failed to generate bio'), { context: 'Generating bio' });
      }
    } catch (error) {
      handleError(error, { context: 'Generating bio' });
    } finally {
      setIsLoadingBio(false);
    }
  }, [user, level, label, notification, handleError]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    impact('medium');
    Alert.alert(
      TEXT.signOut,
      'Are you sure you want to log out?',
      [
        { text: TEXT.cancel, style: 'cancel' },
        {
          text: TEXT.signOut,
          style: 'destructive',
          onPress: async () => {
            try {
              notification('success');
              await signOut();
              // RootNavigator handles the switch to AuthStack automatically
            } catch (error: unknown) {
              handleError(error, { context: 'Logout attempt' });
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [impact, notification, signOut, handleError]);

  // Handle export data
  const handleExportData = useCallback(async () => {
    if (!user) return;

    try {
      impact('light');
      const data = await DataExporter.exportUserData(user);
      if (data) {
        const shared = await DataExporter.shareData(data);
        if (!shared) {
          handleError(new Error('Unable to share your export right now.'), {
            context: 'Profile data export share',
          });
          return;
        }

        await notification('success');
      } else {
        handleError(new Error('Failed to export data.'), { context: 'Data export' });
      }
    } catch (error) {
      handleError(error, { context: 'Data export' });
    }
  }, [user, impact, notification, handleError]);

  const handleExportChatHistory = useCallback(async () => {
    if (!user) return;

    try {
      impact('light');
      const data = await DataExporter.exportChatHistory(user);
      if (!data) {
        handleError(new Error('Failed to export chat history.'), {
          context: 'Profile chat export',
        });
        return;
      }

      const shared = await DataExporter.shareData(data);
      if (!shared) {
        handleError(new Error('Unable to share chat history right now.'), {
          context: 'Profile chat export share',
        });
        return;
      }

      await notification('success');
    } catch (error) {
      handleError(error, { context: 'Profile chat export' });
    }
  }, [user, impact, notification, handleError]);

  // Handle upgrade
  const handleUpgrade = useCallback(() => {
    impact('medium');
    Alert.alert(
      'ResilientHQ+',
      'Premium features including advanced analytics, custom themes, and priority AI responses are on the roadmap. Stay tuned!',
      [{ text: 'OK' }],
    );
  }, [impact]);

  return (
    <ProtectedScreen
      title={TEXT.profile}
      requireAuth={true}
      showHeader={false}
      scroll={false}
      safeAreaTop={true}
      safeAreaBottom={true}
      includeTabBarPadding={false}
    >
      <Animated.ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        accessible={true}
        accessibilityLabel="Profile content"
      >
        {/* Profile Header */}
        <ProfileHeader
          photoURL={avatarUri}
          displayName={userDetails.name}
          email={userDetails.email}
          level={level}
          levelLabel={label}
          onAvatarPress={handleAvatarPress}
          isLoading={isLoadingStats || isUploadingAvatar}
        />

        {/* Profile Stats */}
        <ProfileStats
          moodLogsCount={moodLogsCount}
          journalEntriesCount={journalEntriesCount}
          streakDays={streakDays}
          aiConversationsCount={aiConversationsCount}
          weeklyProgress={weeklyProgress}
        />

        {/* Profile Details */}
        <ProfileDetailsCard
          name={userDetails.name}
          email={userDetails.email}
          age={userDetails.age}
          location={userDetails.location}
          bio={userDetails.bio}
          onEditPress={handleEditPress}
        />

        {/* Personalization */}
        <PersonalizationCard
          bioSummary={bioSummary}
          selfCareScore={selfCareScore}
          aiBioEnabled={FEATURES.aiProfileBioEnabled}
          onGenerateBio={FEATURES.aiProfileBioEnabled ? handleGenerateBio : undefined}
          isLoadingBio={FEATURES.aiProfileBioEnabled ? isLoadingBio : false}
        />

        {/* Account Actions */}
        <AccountActionsCard
          onLogout={handleLogout}
          onExportData={handleExportData}
          onExportChatHistory={handleExportChatHistory}
        />

        {/* Premium Features */}
        <PremiumFeaturesCard isPremium={isPremium} onUpgrade={handleUpgrade} />
      </Animated.ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        initialData={userDetails}
        onSave={handleSaveProfile}
        isSaving={isSaving}
      />
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // paddingBottom handled by ScreenLayout safeAreaBottom
  },
});

export default ProfileScreen;
