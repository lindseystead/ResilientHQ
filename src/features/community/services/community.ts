/**
 * Community Service (Compatibility Wrapper)
 *
 * Transitional feature-local exports that preserve existing import paths while
 * the community data layer now lives in the domain module.
 */

export type {
  Comment,
  Event,
  PaginatedResult,
  PaginationOptions,
  Post,
  Resource,
  Unsubscribe,
} from '@/src/domains/community/community';

export {
  addComment,
  CommunityError,
  createEvent,
  createPost,
  createResource,
  deleteComment,
  deletePost,
  getUserPosts,
  getUserProfile,
  loadMorePosts,
  reportComment,
  reportPost,
  subscribeToComments,
  subscribeToEvents,
  subscribeToPosts,
  subscribeToResources,
  updateComment,
  updatePost,
} from '@/src/domains/community/community';
