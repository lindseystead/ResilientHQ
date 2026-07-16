/**
 * useAuth Hook
 *
 * Re-exports the useAuth hook from AuthContext.
 * This avoids circular dependencies and provides a clean import path.
 *
 * @example
 * ```tsx
 * import { useAuth } from '@/src/providers/AuthProvider';
 * const { user, isAuthenticated, signOut } = useAuth();
 * ```
 */

export { useAuth } from '@/src/providers/AuthProvider';
