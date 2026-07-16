/**
 * Community summary hook
 */

import { useMemo } from 'react';
import { Post } from '../services/community';

const STOP_WORDS = new Set([
  'a',
  'and',
  'are',
  'at',
  'be',
  'for',
  'from',
  'have',
  'how',
  'i',
  'in',
  'is',
  'it',
  'just',
  'my',
  'of',
  'on',
  'that',
  'the',
  'this',
  'to',
  'today',
  'was',
  'with',
  'you',
]);

const extractTopThemes = (posts: Post[]): string[] => {
  const frequency = new Map<string, number>();

  posts.forEach((post) => {
    post.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
      .forEach((token) => {
        frequency.set(token, (frequency.get(token) ?? 0) + 1);
      });
  });

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);
};

export const useCommunitySummary = (posts: Post[]) =>
  useMemo(() => {
    if (posts.length === 0) {
      return null;
    }

    const recentPosts = posts.slice(0, 20);
    const categoryCounts = new Map<string, number>();

    recentPosts.forEach((post) => {
      const normalizedCategory = post.category?.trim() || 'General';
      categoryCounts.set(normalizedCategory, (categoryCounts.get(normalizedCategory) ?? 0) + 1);
    });

    const topCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => `${category}: ${count}`);

    const themes = extractTopThemes(recentPosts);
    const themesLine = themes.length > 0 ? `Common themes: ${themes.join(', ')}.` : null;
    const encouragement =
      recentPosts.length >= 5
        ? 'People are consistently showing up for each other. Keep sharing one small step at a time.'
        : 'Thanks for contributing. Your post can help someone else feel less alone today.';

    return [
      `${recentPosts.length} recent post${recentPosts.length === 1 ? '' : 's'} in your feed.`,
      topCategories.length > 0 ? `Top categories: ${topCategories.join(' • ')}.` : null,
      themesLine,
      encouragement,
    ]
      .filter(Boolean)
      .join('\n');
  }, [posts]);
