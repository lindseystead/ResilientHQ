# 🍃 ResilientHQ Mobile App (Portfolio Snapshot)

### **Portfolio Snapshot — UI, Architecture & Flow Overview (Backend Proprietary)**

[![Build Status](https://img.shields.io/badge/build-expo-blue?logo=expo)](https://expo.dev/)
[![Proprietary](https://img.shields.io/badge/Backend-Proprietary-red)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=20232A)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54.0.25-000000?logo=expo)](https://expo.dev/)
[![Expo Router](https://img.shields.io/badge/Expo%20Router-000000?logo=expo-router)](https://expo-router.com/)
[![Reanimated](https://img.shields.io/badge/Reanimated-5cdb98?logo=react)](https://docs.swmansion.com/react-native-reanimated/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5f72b0?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=ResilientHQ.ResilientHQ)

---

## ⭐ Executive Snapshot

### **Problem**

Users need a responsive wellness companion that unifies journaling, mood tracking, community support, and AI-guided reflection, but existing solutions either lack integration, require constant server connectivity, or don't provide a cohesive mobile experience.

### **Solution**

A **25,500+ line TypeScript React Native application** built as a standalone client leveraging Expo Router, Reanimated, and feature-based modules:

- Unified journaling, mood tracking, community feed, and AI chatbot
- Offline-first architecture with queue system for unreliable networks
- Multi-platform deployment (iOS/Android/Web) with single codebase
- 75+ reusable components across 12 feature categories
- 25+ custom hooks for animations, gestures, and state management
- Biometric security with secure storage for sensitive data
- AI-powered chatbot with streaming responses via OpenAI integration

> ⚠️ The real backend (Firebase rules, production AI models, authentication services, and security implementations) is **proprietary** and not included.

### **Outcome**

- Comprehensive wellness app with **5 core features** in a single unified experience
- **Offline-first architecture** ensuring functionality without constant connectivity
- **Multi-platform support** (iOS/Android/Web) from one codebase
- **Production-ready** with 25,500+ lines of TypeScript and modular architecture
- **Accessible design** with WCAG compliance and responsive layouts

This snapshot demonstrates UI, architecture, flow, and engineering practices — backend logic intentionally excluded.

---

## 🧱 Project Structure

```
app/
  (tabs)/         # Home, Self-Care, Community, Profile
  journal/        # Journaling screens and flows
  chatbot/        # AI chatbot interface
  mood-log/       # Mood logging screens
  mood-tracker/   # Mood tracking and analytics
  settings/       # App settings and preferences
  auth/           # Authentication flows
  ...

src/
  components/     # 75+ reusable components across 12 categories
  screens/         # Screen components and layouts
  hooks/          # 25+ custom hooks (animation, gestures, keyboard)
  providers/      # Context providers (Auth, Theme, Security, AI)
  services/       # Mocked Firebase helpers, OpenAI stubs, offline queue
  utils/          # 39+ utility functions (validation, formatting, responsive)
  config/         # App configuration and constants
  types/          # TypeScript type definitions
  features/       # Feature-based modules
```

### **Key Internal Modules**

- `app/(tabs)/` — Native tab navigation with Home, Self-Care, Community, Profile
- `src/components/journal/` — Journaling suite with PromptCarousel, MoodTimeline, EditorModal
- `src/components/community/` — Community feed with PostCard, ReactionBar, CommentSheet
- `src/hooks/chat/useChatPipeline.ts` — Streaming AI chatbot pipeline
- `src/services/offline/cache.ts` — Offline queue system for data persistence
- `src/providers/AppSecurityProvider.tsx` — Biometric security and privacy controls
- `src/config/theme.ts` — Theming system with hydration-safe color scheme
- `docs/architecture.md` — Architecture overview (if available)

> Backend modules (Firebase rules, production AI models, authentication services, security implementations) are **not included**.

---

## 🔍 Highlights

### **Navigation & Layout**

- Native tab layout covering home/self-care/community/profile
- Floating action buttons with micro-interaction gestures
- Keyboard and safe-area awareness wired through `app/(tabs)` and `ScreenLayout`
- Expo Router for file-based routing with typed navigation

### **Journaling Suite**

- `PromptCarousel` for guided journaling prompts
- `MoodTimeline` for visual mood tracking over time
- Editor modal with autosave and draft restore functionality
- AI assist controls for enhanced journaling experience
- Animated `JournalCard` entries with mood-adaptive styling

### **Community Feed**

- Curated sections powered by `useCommunityFeed` hook
- Animated `PostCard` components with gradient reactions
- `ReactionBar` with interactive feedback
- `CreatePostModal` for content creation
- `CommentSheet` bottom sheet with typing indicators

### **AI Chatbot**

- Streaming responses orchestrated by `useChatPipeline`
- Mood-adaptive header for contextual conversations
- Grounding modal for focused interactions
- Auto-journal suggestions driven by sanitized OpenAI helpers
- Real-time token streaming for responsive UX

### **Security & Privacy**

- UI surfaces for biometric lock and authentication
- Screenshot prevention hints (device-dependent)
- Privacy modes and secure storage
- Data export flows for user control
- Preference hydration via `UserPreferencesStorage`

### **Accessibility & Responsiveness**

- `scaleSpacing` and `scaleFont` utilities for consistent layouts
- Breakpoint system for responsive design
- Focus control for keyboard navigation
- Reanimated transitions for smooth interactions
- WCAG-compliant accessibility features

### **Engineering Practices Demonstrated**

- Feature-based React Native architecture with Expo Router
- TypeScript strict mode across 25,500+ lines of code
- Reanimated v4 for 60fps animations and gesture interactions
- Custom hook library (25+ hooks) for reusable logic
- Modular component system (75+ components across 12 categories)
- Offline-first data layer with queue system
- Context providers for global state management
- Responsive utilities for cross-device compatibility

---

## 📦 Features

- **Mood Tracking:** Visual mood logging with timeline and analytics
- **Journaling:** Guided prompts, AI assistance, and mood-adaptive entries
- **Community Feed:** Curated posts with reactions, comments, and engagement
- **AI Chatbot:** Streaming conversational AI with mood-aware responses
- **Self-Care:** Personalized tips, affirmations, and wellness resources
- **Offline Support:** Queue system for reliable data persistence without connectivity
- **Biometric Security:** Face ID/Touch ID integration with secure storage
- **Multi-Platform:** Single codebase deployment for iOS, Android, and Web
- **Accessibility:** WCAG-compliant design with responsive layouts
- **Theming:** Dark/light mode with hydration-safe color scheme
- **Gesture Interactions:** Swipe, double-tap, long-press, and pull-to-refresh
- **Animation Library:** 7+ custom animation hooks for micro-interactions

---

## 🖼️ Screenshots (COMING SOON)

<table>
  <colgroup>
    <col style="width:420px" />
    <col style="width:auto" />
  </colgroup>
  <tr>
    <td><img src="assets/home.png" width="360" alt="Home screen" /></td>
    <td>Mood-aware hero, highlights, and quick actions from `components/home`.</td>
  </tr>
  <tr>
    <td><img src="assets/journal.png" width="360" alt="Journal screen" /></td>
    <td>Prompt carousel, mood sparkline, animated cards, and editor modal.</td>
  </tr>
  <tr>
    <td><img src="assets/community.png" width="360" alt="Community feed" /></td>
    <td>Curated feed with gradient reactions from `components/community/PostCard.tsx`.</td>
  </tr>
  <tr>
    <td><img src="assets/chatbot.png" width="360" alt="AI chatbot" /></td>
    <td>Streaming AI assistant with mood header and grounding prompts.</td>
  </tr>
  <tr>
    <td><img src="assets/settings.png" width="360" alt="Settings screen" /></td>
    <td>Appearance, notifications, security prompts, and AI personalization panels.</td>
  </tr>
</table>

---

## 🧪 Live Demo

### **1. Local Development Setup**

Install dependencies and clear Metro cache:

```bash
npm install
npm start -- --clear
```

### **2. Exercise Key Flows**

- **Home** → "Need a Nudge?" FAB opens the grounding modal (`components/shared/MicroInteractionButton`, `components/modals/BottomSheet.tsx`)
- **Journal** → Open `EditorModal`, toggle moods, trigger AI assist buttons calling sanitized `services/api/openai.ts`
- **Community** → Interact with `PostCard`, `ReactionBar`, and `CommentSheet`
- **Chatbot** → View streaming bubbles, suggest prompts, and auto-journal invitations via `useChatPipeline`

### **3. Launch Builds**

```bash
npx expo run:ios        # iOS simulator
npx expo run:android    # Android emulator
npm run web             # Web browser
```

### **4. Environment Configuration**

Copy `.env.example` → `.env` with `EXPO_PUBLIC_FIREBASE_*` keys and optional `EXPO_PUBLIC_OPENAI_API_KEY`.

`app.config.js` and `src/config/env.ts` normalize environment values for Expo dev and EAS.

> ⚠️ All backend actions (Firebase authentication, AI model calls, data persistence) are mocked in the demo.

---

## 🛠️ Deployment & Source

### **Client Application**

- **Code:** `app/` and `src/` directories
- **Build Commands:**
  ```bash
  expo start --tunnel      # Preview across devices
  npx expo run:ios        # iOS simulator
  npx expo run:android    # Android emulator
  ```

### **Backend (Proprietary)**

Not included in this repo:

- Firebase Firestore rules and schemas
- Production AI models and OpenAI integration
- Authentication services and user management
- Security implementations and enforcement
- Data persistence and synchronization logic
- Offline queue processing and conflict resolution

Backend logic is proprietary and protected.

---

## 🔐 Privacy & Compliance

This public snapshot:

- Contains **no real user data**
- Uses **mocked payloads & static data**
- Stores everything locally in-browser/device
- Uses typed mock auth instead of real sessions
- Performs zero external network calls to production services
- Meets PIPEDA demonstration standards
- Contains **no API keys, Firebase rules, or service logic**

---

## 📚 Documentation

Comprehensive documentation available in `/docs`:

- `architecture.md` — System architecture overview (if available)
- `data-flow.md` — UI data flow and component interactions (if available)
- This README — Portfolio snapshot overview

---

## 🧹 Portfolio Cleanup Notes

- Added typed auth stub (replaces Firebase in demo)
- Cleaned unused dependencies & analytics
- Updated docs to describe the snapshot architecture
- Ensured app builds cleanly with Expo
- Clarified mock API contracts
- Removed proprietary backend modules
- Added public-safe data flow documentation
- Optimized build & deployment configuration

---

<p align="center">
  <i>Building production-ready solutions that make a difference.</i>
</p>

