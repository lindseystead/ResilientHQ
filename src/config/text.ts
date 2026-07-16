/**
 * Text Constants
 *
 * Centralized text strings for the entire application.
 * All user-facing text should be defined here for consistency,
 * internationalization readiness, and easier maintenance.
 */

export const TEXT = {
  // App
  appName: 'ResilientHQ',
  appTagline: 'Your mental wellness hub',

  // Common
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  cancel: 'Cancel',
  done: 'Done',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  close: 'Close',
  back: 'Back',
  next: 'Next',
  retry: 'Retry',
  ok: 'OK',
  yes: 'Yes',
  no: 'No',

  // Auth - Onboarding (Warm + Supportive)
  signIn: 'Sign In',
  signUp: 'Sign Up',
  signOut: 'Sign Out',
  forgotPassword: 'Forgot your password?',
  resetPassword: 'Reset Your Password',
  createAccount: 'Create Account',
  alreadyHaveAccount: 'Already have an account?',
  dontHaveAccount: "Don't have an account?",
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  firstName: 'First Name',
  lastName: 'Last Name',
  enterEmail: 'name@example.com',
  enterPassword: 'Enter your password',
  createPassword: 'Create a password (min. 6 characters)',
  reenterPassword: 'Re-enter your password',

  // Auth Screen Headers
  signupTitle: 'Create Your Account',
  signupSubtitle: 'Your space to reflect, track your moods, and grow a little each day.',
  loginTitle: 'Welcome Back',
  loginSubtitle: "Good to see you again. Let's check in.",
  resetPasswordTitle: 'Reset Your Password',
  resetPasswordSubtitle: "Enter your email and we'll send you a link to get back in.",

  // Auth Success Messages
  welcomeMessage: "Welcome — we're glad you're here.",
  youAreIn: "You're in.",
  resetLinkSent: 'Check your inbox — your reset link is on the way.',
  resetLinkError: "We couldn't send the reset link. Please try again.",

  // Auth Error Messages (Warm, Not Harsh)
  errorFirstNameRequired: 'Please enter your first name.',
  errorLastNameRequired: 'Please enter your last name.',
  errorEmailRequired: 'Please enter a valid email address.',
  errorPasswordRequired: 'Password must be at least 6 characters.',
  errorPasswordsMatch: 'Passwords must match.',

  // Home
  welcome: 'Welcome to ResilientHQ',
  pleaseSignInHome: 'Please sign in to access your wellness hub.',
  todayHighlights: "Today's Highlights",
  quickActions: 'Quick Actions',

  // Mood
  moodTracker: 'Mood Tracker',
  moodTrackerSubtitle: 'Track your emotions and identify patterns',
  howAreYouFeeling: 'How are you feeling today?',
  logMood: 'Log Mood',
  viewHistory: 'View Mood History',
  moodLogged: 'Mood Logged',
  moodHistory: 'Mood History',
  averageMood: 'Average Mood',
  noMoodLogged: 'No mood logged',

  // Journal
  journal: 'Journal',
  journalEntry: 'Journal Entry',
  addJournalEntry: 'Add Journal Entry',
  editJournalEntry: 'Edit Journal Entry',
  deleteJournalEntry: 'Delete Journal Entry',
  writeYourEntry: 'Write your entry...',
  selectMood: 'Select a mood',
  selectPrompt: 'Select a prompt',
  wellnessTipsTitle: 'Wellness Tips',
  yourJournalEntries: 'Your Journal Entries',
  noEntriesYet: 'No entries yet. Start journaling to see your entries here.',
  pleaseSignInJournal: 'Please sign in to access your journal.',

  // Chatbot
  chatbot: 'AI Chatbot',
  typeMessage: 'Type your message',
  send: 'Send',
  clearChat: 'Clear Chat',
  chatbotWelcomeMessage: "Hello! I'm here to support you. How can I help today?",

  // Community
  community: 'Community',
  createPost: 'Create Post',
  addComment: 'Add Comment',
  shareResource: 'Share Resource',
  shareEvent: 'Share Event',
  all: 'All',
  mentalHealth: 'Mental Health',
  selfCareCategory: 'Self-Care',
  motivation: 'Motivation',
  general: 'General',

  // Self Care
  selfCare: 'Self-Care',
  practicalTips: 'Practical Self-Care Tips',
  dailyAffirmation: 'Daily Affirmation',

  // Help
  help: 'Help',
  faq: 'FAQ',
  tutorials: 'Tutorials',
  contactSupport: 'Contact Support',
  safetyResources: 'Safety Resources',

  // Settings
  settings: 'Settings',
  profile: 'Profile',
  notifications: 'Notifications',
  privacy: 'Privacy',
  security: 'Security',

  // Errors
  errorOccurred: 'An unexpected error occurred. Please try again later.',
  networkError: 'Network error. Please check your connection.',
  signInRequired: 'Sign In Required',
  pleaseSignInAction: 'Please sign in to perform this action.',
  missingFields: 'Please fill out all required fields.',
  invalidEmail: 'Please enter a valid email address',
  passwordTooShort: 'Password must be at least 6 characters',
  passwordsDontMatch: 'Passwords do not match',

  // Success
  accountCreated: 'Account Created',
  accountCreatedMessage: 'Your account has been created successfully! Welcome to ResilientHQ.',
  getStarted: 'Get Started',
  passwordResetSent: 'Password Reset Email Sent',
  passwordResetMessage: 'Check your email for password reset instructions.',

  // Prompts
  moodPrompts: {
    veryLow: [
      'What made today feel heavy?',
      'What emotion is beneath the sadness?',
      'What do you wish someone understood?',
      'What would you tell a friend feeling the same?',
      'What is one small comfort you can offer yourself?',
    ] as string[],
    low: [
      'Describe a moment that felt neutral today.',
      'What helped you stay grounded?',
      'Is there anything you are avoiding?',
      'What is one thing you can simplify today?',
      'What might improve tomorrow by 1%?',
    ] as string[],
    neutral: [
      'What brought you joy today?',
      'What moment felt meaningful?',
      'What did you do well today?',
      'What energized you?',
      'What are you grateful for right now?',
    ] as string[],
    good: [
      'What made you laugh today?',
      'What was the highlight of your day?',
      'What feels exciting lately?',
      'Who made your day better?',
      "What is something you're proud of?",
    ] as string[],
    great: [
      'What fills your heart with love today?',
      'What inspires you right now?',
      'What connection felt meaningful?',
      'What are three things you appreciate deeply?',
      'Where did you feel most like yourself today?',
    ] as string[],
  },

  // Wellness Tips (for Journal) - Evidence-based techniques
  wellnessTips: [
    'Practice box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s.',
    'Write down three things you are grateful for today.',
    'Step outside for 10 minutes of sunlight and fresh air.',
    'Reach out to a friend or loved one you trust.',
    'Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you hear, 3 you feel.',
    'Move your body for just 5 minutes — any movement counts.',
    'Challenge one negative thought by asking: "Is this really true?"',
    'Practice self-compassion: What would you say to a friend in your situation?',
  ] as string[],

  // Self Care Tips (for SelfCare screen) — Evidence-based resilience techniques
  selfCareTipsList: [
    'Practice 4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s. A calming breath pattern.',
    'Drink a full glass of water. Dehydration affects mood and cognition.',
    'Call or text someone you care about. Social connection boosts resilience.',
    'Write 3 specific things you are grateful for. Weekly gratitude journaling improves wellbeing.',
    'Walk for 10 minutes. Movement releases endorphins and reduces anxiety.',
    'Listen to calming music. Slow tempo music lowers heart rate and stress.',
    'Get 10 minutes of natural sunlight. Light exposure regulates mood hormones.',
    'Put your phone in another room for 30 minutes. Digital breaks reduce stress.',
    'Eat a meal mindfully without screens. Mindful eating improves digestion.',
    'Acknowledge one thing you handled well today. Self-recognition builds resilience.',
    'Try cyclic sighing: Long exhale, short inhale. May help ease anxiety.',
    'Clear one small surface. Order in environment supports mental clarity.',
    'Practice self-compassion: "This is hard, and that is okay."',
    'Do 5 minutes of stretching. Releases muscle tension from stress.',
    'Set one boundary today. Boundaries protect your energy and wellbeing.',
    'Notice 5 things you can see right now. Grounding reduces overwhelm.',
    'Hydrate mindfully, noticing the sensation of drinking.',
    'Send a brief message of appreciation to someone. Giving boosts happiness.',
    'Visualize a safe, peaceful place for 2 minutes. Imagery calms the nervous system.',
    'Rest without guilt. Recovery is essential for resilience.',
  ] as string[],

  selfCareTipIcons: [
    'timer-outline',
    'water-outline',
    'people-outline',
    'list-outline',
    'walk-outline',
    'musical-notes-outline',
    'leaf-outline',
    'phone-portrait-outline',
    'nutrition-outline',
    'star-outline',
    'fitness-outline',
    'home-outline',
    'heart-outline',
    'body-outline',
    'hand-left-outline',
    'eye-outline',
    'cafe-outline',
    'mail-outline',
    'cloudy-outline',
    'bed-outline',
  ] as string[],

  selfCareCategories: ['All', 'Body', 'Mind', 'Connection', 'Rest'] as string[],

  // Category mapping per tip index: body, mind, connection, rest
  selfCareTipCategoryMap: [
    'mind',
    'body',
    'connection',
    'mind',
    'body',
    'rest',
    'body',
    'rest',
    'body',
    'mind',
    'body',
    'body',
    'mind',
    'body',
    'connection',
    'rest',
    'body',
    'connection',
    'mind',
    'rest',
  ] as string[],

  // Additional
  whatNext: 'What would you like to do next?',

  // Daily Affirmations - Research-backed self-compassion statements
  affirmations: [
    'I am worthy of care and kindness, especially from myself.',
    'I can handle difficult situations. I have done it before.',
    'It is okay to struggle. This is part of being human.',
    'I am learning and growing every day, even when it does not feel like it.',
    'My feelings are valid, even when they are uncomfortable.',
    'I deserve rest and recovery without guilt.',
    'I am more resilient than I give myself credit for.',
    'This moment is temporary. I can get through this.',
    'I am allowed to set boundaries that protect my wellbeing.',
    'I choose progress over perfection.',
    'I am doing the best I can with what I have right now.',
    'My worth is not defined by my productivity.',
    'I can ask for help. It is a sign of strength, not weakness.',
    'I trust myself to handle whatever comes my way.',
    'I am exactly where I need to be in this moment.',
  ] as string[],

  // Breathing Exercises - Evidence-based techniques
  breathingExercises: {
    boxBreathing: {
      name: 'Box Breathing',
      description: 'Equal parts inhale, hold, exhale, hold — a simple pattern to steady yourself.',
      steps: [
        'Inhale for 4 seconds',
        'Hold for 4 seconds',
        'Exhale for 4 seconds',
        'Hold for 4 seconds',
      ],
      duration: '4-4-4-4',
    },
    relaxingBreath: {
      name: '4-7-8 Breathing',
      description: 'A slow breath pattern that can help you relax.',
      steps: [
        'Inhale through nose for 4 seconds',
        'Hold breath for 7 seconds',
        'Exhale through mouth for 8 seconds',
      ],
      duration: '4-7-8',
    },
    cyclicSighing: {
      name: 'Cyclic Sighing',
      description: 'A double inhale and long exhale that many people find calming.',
      steps: [
        'Inhale through nose',
        'Take a second short inhale to fill lungs',
        'Long slow exhale through mouth',
      ],
      duration: '5 minutes',
    },
  },

  // CBT Thought Challenging Questions
  thoughtChallenges: [
    'What evidence supports this thought?',
    'What evidence contradicts this thought?',
    'What would I tell a friend who had this thought?',
    'Is this thought helpful or harmful to me right now?',
    'What is another way to look at this situation?',
    'Will this matter in 5 years? 5 months? 5 weeks?',
    'Am I catastrophizing or jumping to conclusions?',
    'What is actually within my control here?',
  ] as string[],

  // Grounding Techniques
  groundingTechniques: {
    fiveFourThreeTwo: {
      name: '5-4-3-2-1 Technique',
      description: 'Engages all senses to bring you back to the present moment.',
      steps: [
        'Name 5 things you can see',
        'Name 4 things you can touch',
        'Name 3 things you can hear',
        'Name 2 things you can smell',
        'Name 1 thing you can taste',
      ],
    },
    bodyAwareness: {
      name: 'Body Scan',
      description: 'Notice sensations from head to toe without judgment.',
      steps: [
        'Close your eyes and take a deep breath',
        'Notice sensations in your head and face',
        'Move attention to neck and shoulders',
        'Continue down through arms, chest, stomach',
        'Finish with legs and feet',
      ],
    },
  },
} as const;
