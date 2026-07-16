/**
 * Accessibility Utilities
 *
 * Centralized accessibility helpers for consistent accessibility labels,
 * hints, and roles throughout the app.
 * Provides accessible labels, roles, hints, and screen-reader announcements.
 * Includes screen reader announcements, focus management, and high contrast support.
 */

/**
 * Common Accessibility Labels
 */
export const ACCESSIBILITY_LABELS = {
  // Navigation
  backButton: 'Go back',
  closeButton: 'Close',
  menuButton: 'Open menu',
  settingsButton: 'Open settings',

  // Actions
  addButton: 'Add',
  saveButton: 'Save',
  deleteButton: 'Delete',
  editButton: 'Edit',
  cancelButton: 'Cancel',
  submitButton: 'Submit',
  signInButton: 'Sign in',
  signUpButton: 'Sign up',
  signOutButton: 'Sign out',

  // Forms
  emailInput: 'Email address',
  passwordInput: 'Password',
  confirmPasswordInput: 'Confirm password',
  firstNameInput: 'First name',
  lastNameInput: 'Last name',
  searchInput: 'Search',

  // Journal
  journalEntry: 'Journal entry',
  addJournalEntry: 'Add journal entry',
  editJournalEntry: 'Edit journal entry',
  deleteJournalEntry: 'Delete journal entry',

  // Mood
  moodSlider: 'Mood slider',
  moodEmoji: (label: string) => `Mood emoji ${label}`,
  selectMood: 'Select your current mood',
  viewMoodHistory: 'View mood history',

  // Chat
  chatInput: 'Type your message',
  sendMessage: 'Send message',
  chatMessage: (role: 'user' | 'assistant') => `${role} message`,

  // Community
  likePost: 'Like post',
  commentOnPost: 'Comment on post',
  sharePost: 'Share post',

  // Profile
  profileAvatar: 'Profile picture',
  editProfile: 'Edit profile',
} as const;

/**
 * Common Accessibility Hints
 */
export const ACCESSIBILITY_HINTS = {
  // Navigation
  backButton: 'Double tap to go back to the previous screen',
  closeButton: 'Double tap to close',

  // Actions
  addButton: 'Double tap to add a new item',
  saveButton: 'Double tap to save your changes',
  deleteButton: 'Double tap to delete this item',
  editButton: 'Double tap to edit this item',

  // Forms
  emailInput: 'Enter your email address',
  passwordInput: 'Enter your password',
  confirmPasswordInput: 'Re-enter your password to confirm',
  searchInput: 'Type to search',

  // Journal
  addJournalEntry: 'Double tap to create a new journal entry',
  editJournalEntry: 'Double tap to edit this journal entry',

  // Mood
  moodSlider: 'Slide to select your current mood',
  selectMood: 'Double tap to select this mood',

  // Chat
  sendMessage: 'Double tap to send your message',

  // Community
  likePost: 'Double tap to like this post',
  commentOnPost: 'Double tap to add a comment',
} as const;

/**
 * Common Accessibility Roles
 */
export const ACCESSIBILITY_ROLES = {
  button: 'button',
  text: 'text',
  header: 'header',
  link: 'link',
  image: 'image',
  search: 'search',
  slider: 'adjustable',
  switch: 'switch',
  tab: 'tab',
  alert: 'alert',
  progressbar: 'progressbar',
} as const;

/**
 * Get accessibility props for a button
 */
export const getButtonAccessibility = (
  label: string,
  hint?: string,
): {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: typeof ACCESSIBILITY_ROLES.button;
} => ({
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: ACCESSIBILITY_ROLES.button,
});

/**
 * Get accessibility props for an image
 */
export const getImageAccessibility = (
  label: string,
): { accessibilityLabel: string; accessibilityRole: typeof ACCESSIBILITY_ROLES.image } => ({
  accessibilityLabel: label,
  accessibilityRole: ACCESSIBILITY_ROLES.image,
});
