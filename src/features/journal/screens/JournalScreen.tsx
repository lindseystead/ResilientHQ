/**
 * Journal Screen
 *
 * Journaling system with:
 * - Mood-adaptive UI
 * - Horizontal prompt carousel
 * - Editor with autosave & AI assist
 * - Search & filter functionality
 * - Mood timeline sparkline
 * - Card-based feed
 *
 */

import { MOOD } from '@/src/config/constants';
import { elevation, font } from '@/src/config/theme';
import { useTheme } from '@/src/shared/hooks';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import { useHaptics } from '@/src/shared/hooks/haptics';
import type { HomeStackParamList } from '@/src/navigation/types';
import { announceScreenChange } from '@/src/shared/utils/accessibility';
import { useResponsive } from '@/src/shared/utils/responsive';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  EditorModal,
  JournalCard,
  MoodFilterChips,
  MoodSelector,
  MoodTimeline,
  PromptCarousel,
  ThoughtRecordSheet,
} from '../components';
import {
  Button,
  Card,
  EmptyState,
  FloatingActionButton,
  ProtectedScreen,
  SearchBar,
  SkeletonListItem,
} from '@/src/shared/ui';
import { useStaggerList } from '@/src/shared/hooks/animation';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { THOUGHT_RECORD_PROMPT } from '../utils/thoughtRecord';

import { TEXT } from '@/src/config/text';
import { JournalEntry } from '@/src/features/journal/services/journal';

const moodPromptSets: Record<number, string[]> = {
  0: [...TEXT.moodPrompts.veryLow],
  1: [...TEXT.moodPrompts.low],
  2: [...TEXT.moodPrompts.neutral],
  3: [...TEXT.moodPrompts.good],
  4: [...TEXT.moodPrompts.great],
};

type JournalScreenRouteProp = RouteProp<HomeStackParamList, 'Journal'>;

const JournalScreen: React.FC = () => {
  const route = useRoute<JournalScreenRouteProp>();
  const params = route.params;
  const { theme } = useTheme();
  const { impact, notification } = useHaptics();
  const { scaleFont, scaleSpacing, insets } = useResponsive();
  const listBottomPadding =
    TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(theme.spacing.sm));

  // Data hook
  const {
    moodLogs,
    isLoading,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    filterMood,
    setFilterMood,
    saveEntry,
    updateEntry,
    deleteEntry,
  } = useJournalEntries();

  // UI State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Editor state
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [entryText, setEntryText] = useState<string>('');
  const [allowPersistentSave, setAllowPersistentSave] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Thought-record (guided CBT reframing) state
  const [thoughtRecordVisible, setThoughtRecordVisible] = useState<boolean>(false);
  const [isSavingReframe, setIsSavingReframe] = useState<boolean>(false);

  // Screen animation
  const screenAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    autoStart: true,
  });

  // Get mood from route params
  useEffect(() => {
    if (params?.moodValue) {
      const moodValue = parseInt(params.moodValue);
      if (moodValue >= 0 && moodValue <= 4) {
        setSelectedMood(moodValue);
        setModalVisible(true);
      }
    }
  }, [params]);

  // Announce screen change
  useEffect(() => {
    announceScreenChange('Journal');
  }, []);

  // Handle open modal
  const handleOpenModal = useCallback(() => {
    impact('medium');
    setSelectedMood(null);
    setSelectedPrompt('');
    setEntryText('');
    setAllowPersistentSave(true);
    setEditingEntry(null);
    setModalVisible(true);
  }, [impact]);

  // Handle close modal
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedMood(null);
    setSelectedPrompt('');
    setEntryText('');
    setAllowPersistentSave(true);
    setEditingEntry(null);
  }, []);

  // Handle mood select
  const handleMoodSelect = useCallback((mood: number) => {
    setSelectedMood(mood);
    setSelectedPrompt('');
    setEntryText('');
  }, []);

  // Handle prompt select
  const handlePromptSelect = useCallback((prompt: string) => {
    setSelectedPrompt(prompt);
  }, []);

  // Handle save entry
  const handleSaveEntry = useCallback(async () => {
    if (selectedMood === null || !selectedPrompt || !entryText.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      if (editingEntry && editingEntry.id) {
        // Update existing entry
        await updateEntry(editingEntry.id, {
          mood: selectedMood,
          prompt: selectedPrompt,
          entry: entryText.trim(),
        });
      } else {
        if (allowPersistentSave) {
          // Create new entry
          await saveEntry({
            mood: selectedMood,
            prompt: selectedPrompt,
            entry: entryText.trim(),
          });
        }
      }

      notification('success');
      handleCloseModal();
    } catch {
      // Error already handled by hook
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedMood,
    selectedPrompt,
    entryText,
    editingEntry,
    allowPersistentSave,
    saveEntry,
    updateEntry,
    handleCloseModal,
    notification,
  ]);

  // Save a guided thought-record as a standard journal entry.
  const handleSaveThoughtRecord = useCallback(
    async (entry: string, mood: number) => {
      setIsSavingReframe(true);
      try {
        await saveEntry({ mood, prompt: THOUGHT_RECORD_PROMPT, entry });
        notification('success');
        setThoughtRecordVisible(false);
      } catch {
        // Error already handled by the hook.
      } finally {
        setIsSavingReframe(false);
      }
    },
    [saveEntry, notification],
  );

  // Handle edit entry
  const handleEditEntry = useCallback(
    (entry: JournalEntry) => {
      impact('medium');
      setEditingEntry(entry);
      setSelectedMood(entry.mood);
      setSelectedPrompt(entry.prompt);
      setEntryText(entry.entry);
      setAllowPersistentSave(true);
      setModalVisible(true);
    },
    [impact],
  );

  // Handle delete entry
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      impact('medium');
      try {
        await deleteEntry(entryId);
        notification('success');
      } catch {
        // Error already handled by hook
      }
    },
    [deleteEntry, impact, notification],
  );

  // Get mood color for UI
  const moodColor = selectedMood !== null ? MOOD.colors[selectedMood] : theme.colors.primary;

  // Get available prompts for selected mood
  const availablePrompts = useMemo(
    () => (selectedMood !== null ? moodPromptSets[selectedMood] : []),
    [selectedMood],
  );

  const renderJournalItem = useCallback(
    ({ item, index }: { item: JournalEntry; index: number }) => (
      <JournalListItem
        item={item}
        index={index}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
      />
    ),
    [handleEditEntry, handleDeleteEntry],
  );

  return (
    <ProtectedScreen
      title={TEXT.journal}
      requireAuth={true}
      showHeader={false}
      scroll={false}
      safeAreaTop={true}
      safeAreaBottom={true}
      includeTabBarPadding={false}
      style={styles.container}
    >
      <Animated.View style={[screenAnimation.animatedStyle, styles.content]}>
        {/* Search & Filter Section */}
        <Card
          variant="outlined"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border2,
            marginBottom: 0,
            borderRadius: theme.radius.xs - theme.radius.xs,
            borderTopLeftRadius: theme.radius.xs - theme.radius.xs,
            borderTopRightRadius: theme.radius.xs - theme.radius.xs,
          }}
        >
          {/* Search Bar */}
          <View style={{ marginBottom: scaleSpacing(theme.spacing.md) }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search entries..."
              onClear={() => setSearchQuery('')}
            />
          </View>

          {/* Mood Filter */}
          <MoodFilterChips selectedMood={filterMood} onSelectMood={setFilterMood} />
        </Card>

        {/* Mood Timeline */}
        <MoodTimeline moodLogs={moodLogs} />

        {/* Guided CBT reframing launcher */}
        <View
          style={{
            paddingHorizontal: scaleSpacing(theme.spacing.lg),
            marginTop: scaleSpacing(theme.spacing.sm),
          }}
        >
          <Button
            title="Reframe a thought"
            variant="outline"
            size="small"
            icon="bulb-outline"
            onPress={() => {
              impact('light');
              setThoughtRecordVisible(true);
            }}
          />
        </View>

        {/* Journal Entries List */}
        {isLoading ? (
          <View
            style={[
              styles.loadingContainer,
              {
                paddingHorizontal: scaleSpacing(theme.spacing.lg),
                paddingTop: scaleSpacing(theme.spacing.xl),
              },
            ]}
          >
            <SkeletonListItem count={5} />
          </View>
        ) : filteredEntries.length > 0 ? (
          <FlatList
            data={filteredEntries}
            renderItem={renderJournalItem}
            keyExtractor={(item, index) => item.id || `entry-${index}`}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingHorizontal: scaleSpacing(theme.spacing.lg),
                paddingTop: scaleSpacing(theme.spacing.xl),
                paddingBottom: listBottomPadding,
              },
            ]}
            scrollEnabled={true}
            nestedScrollEnabled={false}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            scrollEventThrottle={16}
            accessible={true}
            accessibilityLabel="Journal entries"
          />
        ) : (
          <View style={[styles.emptyContainer, { padding: scaleSpacing(theme.spacing.xl) }]}>
            <EmptyState
              icon="book-outline"
              message={
                searchQuery || filterMood !== null
                  ? 'No entries match your filters'
                  : 'No entries yet'
              }
            />
          </View>
        )}

        {/* FAB Button */}
        <FloatingActionButton
          icon="add"
          onPress={handleOpenModal}
          accessibilityLabel="Add journal entry"
          accessibilityHint="Tap to create a new journal entry"
        />
      </Animated.View>

      {/* Editor Modal */}
      <EditorModal
        visible={modalVisible}
        onClose={handleCloseModal}
        selectedMood={selectedMood}
        selectedPrompt={selectedPrompt}
        entryText={entryText}
        onEntryTextChange={setEntryText}
        onSave={handleSaveEntry}
        allowPersistentSave={allowPersistentSave}
        onTogglePersistentSave={setAllowPersistentSave}
        saveActionLabel={
          editingEntry
            ? 'Save Changes'
            : allowPersistentSave
              ? 'Save Entry'
              : 'Finish Without Saving'
        }
        isSaving={isSaving}
        isEditing={!!editingEntry}
      />

      {/* Guided CBT reframing sheet */}
      <ThoughtRecordSheet
        visible={thoughtRecordVisible}
        onClose={() => setThoughtRecordVisible(false)}
        onSave={handleSaveThoughtRecord}
        isSaving={isSavingReframe}
      />

      {/* Mood & Prompt Selection Modal (shown when mood selected but no prompt) */}
      {modalVisible && selectedMood !== null && !selectedPrompt && (
        <View
          style={[
            styles.selectionOverlay,
            {
              backgroundColor: withAlpha(theme.colors.black, 0.5),
              padding: scaleSpacing(theme.spacing.xl),
            },
          ]}
        >
          <View
            style={[
              styles.selectionContainer,
              {
                backgroundColor: theme.colors.surface,
                padding: scaleSpacing(theme.spacing.xl),
                borderRadius: theme.radius.lg,
              },
              elevation.medium,
            ]}
          >
            <Text
              style={[
                styles.selectionTitle,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(font.body, 0.3),
                  marginBottom: scaleSpacing(theme.spacing.lg),
                },
              ]}
            >
              How are you feeling?
            </Text>
            <MoodSelector selectedMood={selectedMood} onMoodSelect={handleMoodSelect} />

            {availablePrompts.length > 0 && (
              <>
                <Text
                  style={[
                    styles.selectionTitle,
                    {
                      color: theme.colors.text,
                      fontSize: scaleFont(font.body, 0.3),
                      marginTop: scaleSpacing(theme.spacing.xl),
                      marginBottom: scaleSpacing(theme.spacing.lg),
                    },
                  ]}
                >
                  Choose a Prompt
                </Text>
                <PromptCarousel
                  prompts={availablePrompts}
                  selectedPrompt={selectedPrompt}
                  onPromptSelect={handlePromptSelect}
                  moodColor={moodColor}
                />
              </>
            )}
          </View>
        </View>
      )}
    </ProtectedScreen>
  );
};

const JournalListItem: React.FC<{
  item: JournalEntry;
  index: number;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}> = ({ item, index, onEdit, onDelete }) => {
  const { animatedStyle } = useStaggerList({ index, staggerDelay: 30 });

  return (
    <Animated.View style={animatedStyle}>
      <JournalCard entry={item} onEdit={onEdit} onDelete={onDelete} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    // Padding applied inline
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Padding applied inline with theme spacing token
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // Background color and padding applied inline with theme values
    zIndex: 1000,
  },
  selectionContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    // Background, padding, border radius, and shadow applied inline
  },
  selectionTitle: {
    fontWeight: '700',
  },
});

export default JournalScreen;
