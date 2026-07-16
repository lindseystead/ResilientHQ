import { moderateCommunityContent } from '@/src/domains/community/moderation';

describe('community content moderation', () => {
  it('allows normal supportive posts', () => {
    const result = moderateCommunityContent(
      'Today was hard, but I am taking it one step at a time.',
      'post',
    );

    expect(result.allowed).toBe(true);
    expect(result.normalizedContent).toContain('one step at a time');
  });

  it('blocks crisis-language content from being posted publicly', () => {
    const result = moderateCommunityContent('I want to die and do not feel safe', 'post');

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('CONTENT_SAFETY_BLOCKED');
    expect(result.userMessage).toContain('local emergency services');
  });

  it('blocks personal contact details in comments', () => {
    const result = moderateCommunityContent(
      'Text me at (415) 555-1212 and we can talk.',
      'comment',
    );

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('CONTENT_PII_BLOCKED');
  });
});
