# 🍃 ResilientHQ Mobile App (Portfolio Snapshot)

<p align="center">
  <img src="https://img.shields.io/badge/build-expo-blue?logo=expo" />
  <img src="https://img.shields.io/badge/license-proprietary-red" />
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=20232A" />
  <img src="https://img.shields.io/badge/Expo%20SDK-54.0.25-000000?logo=expo" />
  <img src="https://img.shields.io/badge/Expo%20Router-000000?logo=expo-router" />
  <img src="https://img.shields.io/badge/Reanimated-5cdb98?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5f72b0?logo=typescript" />
  <img src="https://visitor-badge.laobi.icu/badge?page_id=ResilientHQ.ResilientHQ" />
</p>


This repository is a client-only portfolio snapshot. Backend services, Firebase rules, production AI models, and security implementations are intentionally omitted; only the UI-focused, client-side architecture is present.

---

## Executive Snapshot

- **Problem:** Deliver a responsive wellness companion that unifies journaling, mood tracking, community, and AI-guided reflection without relying on server-side infrastructure.
- **Solution:** Rebuild the Expo Go prototype as a standalone client leveraging Expo Router, Reanimated, TypeScript, and feature-based modules, with sanitized helpers for Firebase/OpenAI interactions.
- **Outcome:** A comprehensive UI system that demonstrates advanced state management, navigation, theming, animation, and client-side integration patterns ready for portfolio review.

---

## Structure

```
app/
  (tabs)/         # Home, Self-Care, Community, Profile
  journal/
  chat/
  mood/
  settings/
  auth/
  security/
  ...

features/
providers/
services/           # Mocked Firebase helpers, OpenAI stubs, and offline queue
hooks/              # animation, gesture, responsive, keyboard
theme/              # colors, shadows, typography, hydration-safe scheme
docs/
```

- Feature modules under `/features/*` contain domain screens and workflows (mood, journal, community, chat, auth, security) implemented solely on the client.
- Providers (`ThemeProvider`, `AuthProvider`, `AppSecurityProvider`, `AISettingsProvider`) deliver theming, preferences, and UI-level controls.
- Expo Router organizes the `(tabs)` experience while secondary flows (journal, mood log, chatbot, settings) run in a separate stack for clarity.
- Reanimated v4, Gesture Handler v3, and custom micro-interaction hooks drive polished animations and gestures.
- Services simulate Firebase/OpenAI interactions with sanitized payloads and offline queue logic.
- Responsive utilities (`useResponsive`, `scaleSpacing`, `scaleFont`) provide consistent layout across breakpoints.

---

## Highlights

- **Navigation:** Native tab layout covering home/self-care/community/profile, floating action buttons, micro-interaction gestures, and keyboard/safe-area awareness wired through `app/(tabs)` and `ScreenLayout`.
- **Journaling Suite:** `components/journal/PromptCarousel.tsx`, `components/journal/MoodTimeline.tsx`, editor modal with autosave/draft restore, AI assist controls, and animated `components/journal/JournalCard.tsx` entries.
- **Community Feed:** Curated sections powered by `hooks/community/useCommunityFeed.ts`, animated `PostCard`, gradient `ReactionBar`, `CreatePostModal`, and `CommentSheet` bottom sheet with typing indicators.
- **AI Chatbot:** Streaming responses orchestrated by `useChatPipeline`, mood-adaptive header, grounding modal, and auto-journal suggestions driven by sanitized OpenAI helpers.
- **Security & Privacy:** UI surfaces for biometric lock, screenshot prevention, privacy modes, secure storage, data export, and preference hydration via `UserPreferencesStorage`.
- **Accessibility & Responsiveness:** `scaleSpacing`, `scaleFont`, breakpoints, focus control, and Reanimated transitions keep interactions accessible.

---

## Skills Demonstrated

- Architecture: React Native + Expo Router with typed navigation and feature folders.  
- TypeScript: strict typing, path aliases (`@/src/…`), and reusable utility interfaces.  
- Animation: Reanimated v4, micro-interactions, and gesture hooks (`hooks/gestures/*`).  
- AI & Data Flow: Streaming OpenAI pipeline (`services/api/openai.ts`), `useChatPipeline`, and sanitized service helpers.  
- Persistence: Mocked Firebase/Firestore helpers, offline queue cache (`services/offline/cache.ts`).  
- Theming: hydration-safe `useColorScheme`, `ThemeProvider`, `colors`, `shadows`, gradients.  
- Security prompts: `providers/AppSecurityProvider.tsx` and UI-level biometric hints.  
- Solo delivery: every component, hook, provider, and screen authored by one engineer.

---

## Live Demo Notes

1. Install dependencies and clear Metro cache:  
   ```bash  
   npm install  
   npm start -- --clear  
   ```
2. Exercise the key flows:  
   - Home → “Need a Nudge?” FAB opens the grounding modal (`components/shared/MicroInteractionButton`, `components/bottom-sheet/BottomSheet.tsx`).  
   - Journal → open `EditorModal`, toggle moods, trigger AI assist buttons calling sanitized `services/api/openai.ts`.  
   - Community → interact with `PostCard`, `ReactionBar`, and `CommentSheet`.  
   - Chatbot → view streaming bubbles, suggest prompts, and auto-journal invitations via `useChatPipeline`.  
3. Launch builds:  
   ```bash  
   npx expo run:ios  
   npx expo run:android  
   npm run web  
   ```
4. Copy `.env.example` → `.env` with `EXPO_PUBLIC_FIREBASE_*` keys and optional `EXPO_PUBLIC_OPENAI_API_KEY`.  
5. `app.config.js` and `src/config/env.ts` normalize environment values for Expo dev and EAS.

---

## Features

- Mood-aware home with highlights, quick actions, and tabbed navigation (`components/home`, `app/(tabs)`).  
- Journaling workflow: `PromptCarousel`, `MoodTimeline`, AI assist buttons, autosave/draft restore, mood-adaptive `JournalCard`.  
- Community feed: `useCommunityFeed`, animated `PostCard`, `ReactionBar`, AI summaries, and `CommentSheet`.  
- AI chatbot: `useChatPipeline`, streaming tokens, grounding prompts, auto-journal suggestions.  
- Settings: appearance, notifications, privacy, AI personalization, biometric toggles, and developer utilities.  
- Gesture utilities: `useSwipeGesture`, `useDoubleTap`, `useLongPress`, `useSwipeToDelete`.  
- Responsive suite: `useResponsive`, `useBreakpoints`, `scaleSpacing`, `scaleFont`, plus `useKeyboardAwareScroll`.  
- Offline queue/cache: `services/offline/cache.ts` buffers mood, journal, and community writes with sanitized data.

---

## Screenshots

| Screen | Description |  
| --- | --- |  
| Home | Mood-aware hero, highlights, and quick actions from `components/home`. |  
| Journal | Prompt carousel, mood sparkline, animated cards, editor modal. |  
| Community | Curated feed with gradient reactions from `components/community/PostCard.tsx`. |  
| Chatbot | Streaming assistants, mood header, grounding prompt. |  
| Settings | Appearance, notifications, security prompts, and AI personalization panels. |

Visual assets will be published once sanitized exports exist (`assets/*.png`).

---

## Deployment & Source

- Client-only repository (no backend, Firebase rules, or private infrastructure).  
- Source layout: `app/`, `features/`, `providers/`, `components/`, `services/`, `hooks/`, `theme/`, plus targeted utilities (`responsive`, `format`, `validation`).  
- Build commands:  
  ```bash  
  expo start --tunnel      # preview across devices  
  npx expo run:ios        # simulator  
  npx expo run:android    # emulator  
  ```  
- Tech stack: Expo SDK 54.0.25, Expo Router ~6.0, React Native 0.81.5, Reanimated ~4.1, Gesture Handler ~2.28, Firebase 12.6, and mocked OpenAI services.

---

## Privacy & Compliance

- No real user data; OpenAI flows return sanitized responses.  
- Secrets managed via `.env` (`EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_OPENAI_API_KEY`); `src/config/env.ts` normalizes values for dev/EAS.  
- Biometric and screenshot prevention hints remain UI-level only; enforcement depends on the deployed device.  
- Offline queue/cache service (`services/offline/cache.ts`) keeps writes local until connectivity resumes.  
- Data export flows exist solely in the client UI; backend persistence remains proprietary and excluded.

---

## Portfolio Polish & Cleanup

- Solo dev story: every component, hook, provider, and screen built by one engineer.  
- Tooling note: fix npm permissions (`@sigstore/verify` in `/opt/homebrew/lib/node_modules/npm`) before running `npm run lint`; resolve duplicate `react-native-safe-area-context` versions for `expo doctor`.  
- Documentation updates: `docs/architecture.md`, `docs/data-flow.md`, and this README specify what is mocked vs. shipped.  
- Screenshot guidance added for future exports (`assets/home.png`, `assets/community.png`).  
- Roadmap: align native dependencies, add Jest/Detox suites, improve offline queue logging, expand docs/diagrams, and publish Android + iOS preview builds.  
***EOF
