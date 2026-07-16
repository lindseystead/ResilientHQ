/**
 * Thought Record Sheet
 *
 * Guided cognitive-reframing (CBT) exercise. Collects the situation, automatic
 * thought, evidence, and a balanced reframe, then produces a standard journal
 * entry via the existing save flow — no new persistence or schema.
 */

import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet, Button, Input, MoodSelector } from '@/src/shared/ui';
import Text from '@/src/shared/ui/primitives/Text';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';
import {
  composeThoughtRecordEntry,
  EMPTY_THOUGHT_RECORD,
  isThoughtRecordComplete,
  type ThoughtRecordInput,
} from '../utils/thoughtRecord';

interface ThoughtRecordSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: string, mood: number) => Promise<void>;
  isSaving: boolean;
}

const multilineStyle = { minHeight: 72, textAlignVertical: 'top' as const };

const ThoughtRecordSheet: React.FC<ThoughtRecordSheetProps> = ({
  visible,
  onClose,
  onSave,
  isSaving,
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();
  const [fields, setFields] = useState<ThoughtRecordInput>(EMPTY_THOUGHT_RECORD);
  const [mood, setMood] = useState<number | null>(null);

  const update = (key: keyof ThoughtRecordInput) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const reset = useCallback(() => {
    setFields(EMPTY_THOUGHT_RECORD);
    setMood(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const canSave = isThoughtRecordComplete(fields) && mood !== null && !isSaving;

  const handleSave = useCallback(async () => {
    if (mood === null || !isThoughtRecordComplete(fields)) {
      return;
    }
    await onSave(composeThoughtRecordEntry(fields), mood);
    reset();
  }, [fields, mood, onSave, reset]);

  return (
    <BottomSheet visible={visible} onClose={handleClose} title="Reframe a thought">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: scaleSpacing(theme.spacing.xl) }]}
      >
        <Text
          variant="body"
          muted
          style={[styles.intro, { marginBottom: scaleSpacing(theme.spacing.md) }]}
        >
          A quick cognitive-reframing exercise: notice the thought, weigh the evidence, and write a
          more balanced view. It becomes a private journal entry.
        </Text>

        <Input
          label="What happened?"
          placeholder="The situation or trigger"
          value={fields.situation}
          onChangeText={update('situation')}
          multiline
          style={multilineStyle}
        />
        <Input
          label="Automatic thought"
          placeholder="The thought that popped up"
          value={fields.automaticThought}
          onChangeText={update('automaticThought')}
          multiline
          style={multilineStyle}
        />
        <Input
          label="Evidence for it (optional)"
          placeholder="What supports this thought?"
          value={fields.evidenceFor}
          onChangeText={update('evidenceFor')}
          multiline
          style={multilineStyle}
        />
        <Input
          label="Evidence against it (optional)"
          placeholder="What doesn't quite fit?"
          value={fields.evidenceAgainst}
          onChangeText={update('evidenceAgainst')}
          multiline
          style={multilineStyle}
        />
        <Input
          label="Balanced reframe"
          placeholder="A fairer, kinder way to see it"
          value={fields.reframe}
          onChangeText={update('reframe')}
          multiline
          style={multilineStyle}
        />

        <Text
          variant="label"
          weight="600"
          style={[styles.moodHeading, { color: theme.colors.text }]}
        >
          How do you feel now?
        </Text>
        <MoodSelector selectedMood={mood} onMoodSelect={setMood} />

        <View style={{ marginTop: scaleSpacing(theme.spacing.lg) }}>
          <Button
            title="Save reframe"
            onPress={handleSave}
            disabled={!canSave}
            loading={isSaving}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
  },
  intro: {
    lineHeight: 20,
  },
  moodHeading: {
    marginTop: 4,
    marginBottom: 8,
  },
});

export default ThoughtRecordSheet;
