import {
  composeThoughtRecordEntry,
  isThoughtRecordComplete,
  THOUGHT_RECORD_PROMPT,
  type ThoughtRecordInput,
} from '@/src/features/journal/utils/thoughtRecord';

const base: ThoughtRecordInput = {
  situation: 'Presented at the team meeting',
  automaticThought: 'Everyone thought I did badly',
  evidenceFor: 'I stumbled on one slide',
  evidenceAgainst: 'Two people said it was clear and helpful',
  reframe: 'It went okay; one stumble does not define it',
};

describe('thought record (CBT reframing)', () => {
  it('requires situation, automatic thought, and reframe to be complete', () => {
    expect(isThoughtRecordComplete(base)).toBe(true);
    expect(isThoughtRecordComplete({ ...base, reframe: '   ' })).toBe(false);
    expect(isThoughtRecordComplete({ ...base, situation: '' })).toBe(false);
    // Evidence is optional.
    expect(isThoughtRecordComplete({ ...base, evidenceFor: '', evidenceAgainst: '' })).toBe(true);
  });

  it('composes the fields into a readable, structured entry', () => {
    const entry = composeThoughtRecordEntry(base);

    expect(entry).toContain('Situation:\nPresented at the team meeting');
    expect(entry).toContain('Automatic thought:\nEveryone thought I did badly');
    expect(entry).toContain('Evidence for it:\nI stumbled on one slide');
    expect(entry).toContain('Evidence against it:\nTwo people said it was clear and helpful');
    expect(entry).toContain('Balanced reframe:\nIt went okay; one stumble does not define it');
  });

  it('omits empty optional evidence sections', () => {
    const entry = composeThoughtRecordEntry({ ...base, evidenceFor: '', evidenceAgainst: '  ' });

    expect(entry).not.toContain('Evidence for it');
    expect(entry).not.toContain('Evidence against it');
    // Required sections still present.
    expect(entry).toContain('Situation:');
    expect(entry).toContain('Balanced reframe:');
  });

  it('exposes a stable prompt tag for reframe entries', () => {
    expect(THOUGHT_RECORD_PROMPT).toBe('Thought reframe (CBT)');
  });
});
