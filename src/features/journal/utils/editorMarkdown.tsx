/**
 * Journal editor markdown helpers
 */

import React from 'react';
import { Text } from 'react-native';

export const renderMarkdown = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /_(.*?)_/g;

  let match: RegExpExecArray | null;
  const segments: {
    start: number;
    end: number;
    type: 'bold' | 'italic' | 'normal';
    text: string;
  }[] = [];

  while ((match = boldRegex.exec(text)) !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'bold',
      text: match[1],
    });
  }

  while ((match = italicRegex.exec(text)) !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'italic',
      text: match[1],
    });
  }

  segments.sort((a, b) => a.start - b.start);

  let currentIndex = 0;
  segments.forEach((segment) => {
    if (segment.start > currentIndex) {
      parts.push(text.substring(currentIndex, segment.start));
    }

    parts.push(
      <Text
        key={`${segment.start}-${segment.type}`}
        style={segment.type === 'bold' ? { fontWeight: '700' } : { fontStyle: 'italic' }}
      >
        {segment.text}
      </Text>,
    );

    currentIndex = segment.end;
  });

  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
};
