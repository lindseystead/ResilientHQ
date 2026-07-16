/**
 * Community Feed Hook
 *
 * Centralized hook for managing community feed data including posts, trending,
 * mood-based posts, resources, and events. Handles real-time subscriptions,
 * pagination, and error handling.
 */

import {
  addComment as addCommentEnhanced,
  Comment,
  CommunityError,
  createPost as createPostEnhanced,
  Event,
  loadMorePosts,
  PaginatedResult,
  Post,
  Resource,
  subscribeToComments as subscribeToCommentsEnhanced,
  subscribeToEvents,
  subscribeToPosts as subscribeToPostsEnhanced,
  subscribeToResources,
} from '@/src/domains/community';
import { getUserMoodLogs, MoodLog } from '@/src/domains/wellbeing';
import { User } from 'firebase/auth';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseCommunityFeedReturn {
  // Posts
  posts: Post[];
  trendingPosts: Post[];
  moodBasedPosts: Post[];
  recentPosts: Post[];
  myPosts: Post[];
  supportPosts: Post[];

  // Comments
  comments: Record<string, Comment[]>;

  // Resources
  resources: Resource[];

  // Events
  events: Event[];

  // Loading states
  isLoadingPosts: boolean;
  isLoadingComments: Record<string, boolean>;
  isLoadingResources: boolean;
  isLoadingEvents: boolean;

  // Error state
  error: {
    message: string;
    retryable: boolean;
    onRetry?: () => void;
  } | null;

  // Pagination
  hasMore: boolean;
  loadMore: () => Promise<void>;

  // Actions
  createPost: (category: string, content: string, mood?: number) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  refresh: () => void;

  // Filters
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  feedFilter: 'forYou' | 'trending' | 'recent' | 'myPosts' | 'support';
  setFeedFilter: (filter: 'forYou' | 'trending' | 'recent' | 'myPosts' | 'support') => void;
}

export const useCommunityFeed = (user: User | null): UseCommunityFeedReturn => {
  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [latestMood, setLatestMood] = useState<MoodLog | null>(null);

  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({});
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);

  // Error state
  const [error, setError] = useState<{
    message: string;
    retryable: boolean;
    onRetry?: () => void;
  } | null>(null);

  // Pagination
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedFilter, setFeedFilter] = useState<
    'forYou' | 'trending' | 'recent' | 'myPosts' | 'support'
  >('forYou');

  // Expanded posts (for lazy loading comments)
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Load latest mood
  useEffect(() => {
    const loadMood = async () => {
      if (!user) return;
      try {
        const moodLogs = await getUserMoodLogs(user, 1);
        if (moodLogs.length > 0) {
          setLatestMood(moodLogs[0]);
        }
      } catch {
        // Silently fail
      }
    };
    loadMood();
  }, [user]);

  // Subscribe to posts
  useEffect(() => {
    if (!user) {
      setIsLoadingPosts(false);
      setPosts([]);
      setLastDoc(null);
      setHasMore(true);
      return;
    }

    setIsLoadingPosts(true);
    setError(null);
    setLastDoc(null);
    setHasMore(true);

    // Cleanup previous subscriptions
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];

    const postsUnsubscribe = subscribeToPostsEnhanced(
      selectedCategory,
      (fetchedPosts) => {
        setPosts(fetchedPosts);
        setIsLoadingPosts(false);
        setError(null);
      },
      (err: CommunityError) => {
        setIsLoadingPosts(false);
        setError({
          message: err.message,
          retryable: err.retryable,
          onRetry: () => {
            setIsLoadingPosts(true);
            setError(null);
          },
        });
      },
    );
    unsubscribeRefs.current.push(postsUnsubscribe);

    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [user, selectedCategory]);

  // Subscribe to resources
  useEffect(() => {
    if (!user) {
      setIsLoadingResources(false);
      setResources([]);
      return;
    }

    setIsLoadingResources(true);
    const resourcesUnsubscribe = subscribeToResources((fetchedResources) => {
      setResources(fetchedResources);
      setIsLoadingResources(false);
    });
    unsubscribeRefs.current.push(resourcesUnsubscribe);

    return () => {
      resourcesUnsubscribe();
    };
  }, [user]);

  // Subscribe to events
  useEffect(() => {
    if (!user) {
      setIsLoadingEvents(false);
      setEvents([]);
      return;
    }

    setIsLoadingEvents(true);
    const eventsUnsubscribe = subscribeToEvents((fetchedEvents) => {
      setEvents(fetchedEvents);
      setIsLoadingEvents(false);
    });
    unsubscribeRefs.current.push(eventsUnsubscribe);

    return () => {
      eventsUnsubscribe();
    };
  }, [user]);

  // Lazy load comments for expanded posts
  useEffect(() => {
    if (!user || expandedPosts.size === 0) return;

    const commentUnsubscribes: (() => void)[] = [];

    expandedPosts.forEach((postId) => {
      setIsLoadingComments((prev) => ({ ...prev, [postId]: true }));

      const unsubscribe = subscribeToCommentsEnhanced(
        postId,
        (postComments) => {
          setComments((prev) => ({
            ...prev,
            [postId]: postComments,
          }));
          setIsLoadingComments((prev) => ({ ...prev, [postId]: false }));
        },
        () => {
          setIsLoadingComments((prev) => ({ ...prev, [postId]: false }));
        },
      );
      commentUnsubscribes.push(unsubscribe);
    });

    return () => {
      commentUnsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [expandedPosts, user]);

  // Computed feed sections
  const trendingPosts = useMemo(() => {
    // Simple trending: posts with most comments (would need comment count in Post type)
    return posts.slice(0, 5);
  }, [posts]);

  const moodBasedPosts = useMemo(() => {
    if (!latestMood) return [];
    const moodValue = latestMood.moodValue;

    // Map mood to category
    let targetCategory = 'General';
    if (moodValue <= 1) {
      targetCategory = 'Support';
    } else if (moodValue >= 3) {
      targetCategory = 'Motivation';
    } else {
      targetCategory = 'Self Care';
    }

    return posts.filter((p) => p.category === targetCategory).slice(0, 5);
  }, [posts, latestMood]);

  const recentPosts = useMemo(() => {
    return posts.slice(0, 10);
  }, [posts]);

  const myPosts = useMemo(() => {
    if (!user) return [];
    return posts.filter((p) => p.authorId === user.uid);
  }, [posts, user]);

  const supportPosts = useMemo(() => {
    return posts.filter((p) => p.category === 'Support' || p.category === 'Mental Health');
  }, [posts]);

  // Filtered posts based on feed filter
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Apply feed filter
    switch (feedFilter) {
      case 'trending':
        filtered = trendingPosts;
        break;
      case 'recent':
        filtered = recentPosts;
        break;
      case 'myPosts':
        filtered = myPosts;
        break;
      case 'support':
        filtered = supportPosts;
        break;
      case 'forYou':
      default:
        filtered = moodBasedPosts.length > 0 ? moodBasedPosts : recentPosts;
        break;
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.content.toLowerCase().includes(query) || p.authorName.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [
    posts,
    feedFilter,
    searchQuery,
    trendingPosts,
    recentPosts,
    myPosts,
    supportPosts,
    moodBasedPosts,
  ]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingPosts || !user) return;

    try {
      setIsLoadingPosts(true);
      const result: PaginatedResult<Post> = await loadMorePosts(selectedCategory, lastDoc);
      setPosts((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err: unknown) {
      if (err instanceof CommunityError && err.retryable) {
        setError({
          message: err.message,
          retryable: true,
          onRetry: loadMore,
        });
      }
    } finally {
      setIsLoadingPosts(false);
    }
  }, [hasMore, isLoadingPosts, user, selectedCategory, lastDoc]);

  // Create post
  const createPost = useCallback(
    async (category: string, content: string) => {
      if (!user) return;
      await createPostEnhanced(user, category, content);
    },
    [user],
  );

  // Add comment
  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!user) return;
      await addCommentEnhanced(user, postId, content);
    },
    [user],
  );

  // Refresh
  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    setExpandedPosts(new Set());
  }, []);

  return {
    posts: filteredPosts,
    trendingPosts,
    moodBasedPosts,
    recentPosts,
    myPosts,
    supportPosts,
    comments,
    resources,
    events,
    isLoadingPosts,
    isLoadingComments,
    isLoadingResources,
    isLoadingEvents,
    error,
    hasMore,
    loadMore,
    createPost,
    addComment,
    refresh,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    feedFilter,
    setFeedFilter,
  };
};
