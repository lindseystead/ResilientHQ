/**
 * Community Domain Service Exports
 *
 * Public compatibility surface for the community domain.
 */

export type {
  Comment,
  Event,
  PaginatedResult,
  PaginationOptions,
  Post,
  Resource,
  Unsubscribe,
} from './types';

export { CommunityError } from './types';
export { getUserProfile } from './shared';
export {
  createPost,
  deletePost,
  getUserPosts,
  loadMorePosts,
  reportPost,
  subscribeToPosts,
  updatePost,
} from './posts';
export {
  addComment,
  deleteComment,
  reportComment,
  subscribeToComments,
  updateComment,
} from './comments';
export { createEvent, createResource, subscribeToEvents, subscribeToResources } from './content';
