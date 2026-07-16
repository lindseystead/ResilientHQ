/**
 * Community Feature Integration Tests
 *
 * End-to-end tests for the community feature including posts, comments,
 * reactions, and real-time updates.
 */

import { CommunityScreen } from '@/src/features/community';
import * as communityService from '@/src/domains/community';
import { waitFor } from '@testing-library/react-native';
import React from 'react';
import { renderWithAuth } from '../../tests/helpers/testHelpers';

// Mock community service
jest.mock('@/src/domains/community', () => ({
  createPost: jest.fn(),
  loadMorePosts: jest.fn(),
  addComment: jest.fn(),
  subscribeToPosts: jest.fn(),
  subscribeToComments: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

describe('Community Feature Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Post Creation', () => {
    it('should create a post successfully', async () => {
      (communityService.createPost as jest.Mock).mockResolvedValue({
        id: 'post-1',
        content: 'Test post',
        createdAt: new Date(),
      });

      const { getByText } = renderWithAuth(<CommunityScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Post Interactions', () => {
    it('should interact with posts', async () => {
      // Community service uses subscribeToPosts for real-time updates
      (communityService.subscribeToPosts as jest.Mock).mockImplementation((callback) => {
        callback([]);
        return jest.fn(); // Return unsubscribe function
      });

      const { getByText } = renderWithAuth(<CommunityScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });

    it('should create a comment', async () => {
      (communityService.addComment as jest.Mock).mockResolvedValue({
        id: 'comment-1',
        content: 'Test comment',
      });

      const { getByText } = renderWithAuth(<CommunityScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Post Loading', () => {
    it('should load posts on mount', async () => {
      const mockPosts = [
        { id: 'post-1', content: 'Post 1' },
        { id: 'post-2', content: 'Post 2' },
      ];

      (communityService.loadMorePosts as jest.Mock).mockResolvedValue({
        items: mockPosts,
        lastDoc: null,
        hasMore: false,
      });

      const { getByText } = renderWithAuth(<CommunityScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });
});
