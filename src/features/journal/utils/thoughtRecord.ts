/**
 * Thought Record (CBT reframing)
 *
 * A guided cognitive-reframing exercise (situation -> automatic thought ->
 * evidence -> balanced reframe) that produces a standard journal entry. It
 * reuses the existing journal entry model, so no schema change is required: the
 * composed text is stored in `entry` and tagged via the `prompt` field.
 */

export interface ThoughtRecordInput {
  situation: string;
  automaticThought: string;
  evidenceFor: string;
  evidenceAgainst: string;
  reframe: string;
}

/** Stored in the journal entry's `prompt` field so reframe entries are identifiable. */
export const THOUGHT_RECORD_PROMPT = 'Thought reframe (CBT)';

export const EMPTY_THOUGHT_RECORD: ThoughtRecordInput = {
  situation: '',
  automaticThought: '',
  evidenceFor: '',
  evidenceAgainst: '',
  reframe: '',
};

/**
 * The three fields that make a reframe meaningful: the trigger, the thought, and
 * the balanced alternative. Evidence is supportive but optional.
 */
export const isThoughtRecordComplete = (input: ThoughtRecordInput): boolean =>
  input.situation.trim().length > 0 &&
  input.automaticThought.trim().length > 0 &&
  input.reframe.trim().length > 0;

/** Composes the guided fields into a single, readable journal entry body. */
export const composeThoughtRecordEntry = (input: ThoughtRecordInput): string => {
  const sections: string[] = [
    `Situation:\n${input.situation.trim()}`,
    `Automatic thought:\n${input.automaticThought.trim()}`,
  ];

  if (input.evidenceFor.trim()) {
    sections.push(`Evidence for it:\n${input.evidenceFor.trim()}`);
  }
  if (input.evidenceAgainst.trim()) {
    sections.push(`Evidence against it:\n${input.evidenceAgainst.trim()}`);
  }

  sections.push(`Balanced reframe:\n${input.reframe.trim()}`);

  return sections.join('\n\n');
};
