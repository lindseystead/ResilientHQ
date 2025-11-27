# 🍃 ResilientHQ Mobile App (Portfolio Snapshot)

![Build Status](https://img.shields.io/badge/build-expo-blue?logo=expo)  
![Proprietary](https://img.shields.io/badge/license-proprietary-red)  
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=20232A)  
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54.0.25-000000?logo=expo)  
![Expo Router](https://img.shields.io/badge/Expo%20Router-000000?logo=expo-router)  
![Reanimated](https://img.shields.io/badge/Reanimated-5cdb98?logo=react)  
![TypeScript](https://img.shields.io/badge/TypeScript-5f72b0?logo=typescript)  
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=ResilientHQ.ResilientHQ)

*Portfolio Status: Screenshots and sanitized UI assets will be added shortly.*

This repository is a client-only portfolio snapshot. Backend systems, Firebase rules, production AI models, security implementations, and private infrastructure are intentionally omitted, mocked, or sanitized—what remains here is the UI-focused, client-side engineering story. Screenshots and code samples will be added once the sanitized assets are ready.

---

## Executive Snapshot

- **Problem:** People needed a private, on-device wellness companion that blends journaling, mood tracking, community care, and AI-guided reflection without feeling clinical or overwhelming.
- **Solution:** A bespoke React Native experience extracted from Expo Go, rebuilt as a standalone client with Expo Router, feature-based modules, Reanimated transitions, biometric-friendly UI prompts, and AI journaling flows mocked via sanitized services.
- **Outcome:** A responsive, privacy-first interface that showcases advanced navigation, animation, theming, data flow, and AI-driven UX, all implemented end-to-end by one engineer for portfolio review.

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
services/           # Mocked Firebase helpers, OpenAI stubs, offline queue
hooks/              # animation, gesture, responsive, keyboard
theme/              # colors, shadows, typography, hydration-safe scheme
docs/
```

- Feature-based modules (`/features/*`) encapsulate mood, journal, community, chat, auth, and security logic purely on the client.
- Providers (`ThemeProvider`, `AuthProvider`, `AppSecurityProvider`, `AISettingsProvider`) hydrate theming, preferences, and mocked safeguards at the UI layer.
- Expo Router powers a `(tabs)` layout for the four core sections while journal, mood log, chatbot, and settings flows slip outside the main tab bar to preserve separation.
- Reanimated v4 + Gesture Handler v3 transitions, haptics, and micro-interaction hooks orchestrate polished animations.
- Mocked services simulate mood logs, journal entries, community posts, AI reflections, and offline queueing so the UI is portfolio-safe.
- Hydration-safe theming plus responsive utilities (`useResponsive`, `scaleSpacing`, `scaleFont`) deliver multi-device polish.

---

## Highlights

- **Navigation:** Tab-based home, self-care, community, profile, floating action buttons, micro-interaction gestures, and keyboard-/safe-area-aware layouts via `app/(tabs)` and shared `ScreenLayout`.
- **Journaling Suite:** Prompt carousel (`components/journal/PromptCarousel.tsx`), mood timeline sparkline, autosave/draft restore, mood-aware editor modal, AI rewriting assistance (sanitized outputs), and animated journal cards (`components/journal/JournalCard.tsx`).
- **Community Feed:** Trending/mood-aware sections sourced from `hooks/community/useCommunityFeed.ts`, animated `PostCard`, gradient `ReactionBar`, `CreatePostModal` with tagging + AI summaries, and `CommentSheet` BottomSheet interactions.
- **AI Chatbot:** Streaming assistant bubbles via `useChatPipeline`, mood-adaptive header, grounding modal, and auto-journal prompts (all mocked through sanitized OpenAI stubs).
- **Security & Privacy:** Biometric-friendly UI prompts, screenshot prevention hints, privacy modes, secure storage surfaces, data export UX, and preference hydration (`UserPreferencesStorage`) presented as mock flows.
- **Accessibility & Responsiveness:** `scaleSpacing`, `scaleFont`, responsive breakpoints, announcements, focus control, and WCAG-friendly transitions orchestrated through shared hooks.

---

## Skills Demonstrated

- Mobile architecture with React Native + Expo Router  
- TypeScript-first engineering patterns and strict typing  
- Advanced animations via Reanimated v4 and micro-interaction hooks  
- Gesture systems (`hooks/gestures/*`), double tap/long press/swipe, and haptics  
- AI integrations (streaming OpenAI pipeline via `services/api/openai.ts` and `useChatPipeline`, mocked)  
- Firebase-backed data flows + offline queue/cache service logic (`services/offline/cache.ts`, sanitized)  
- Theming system with hydration-safe `useColorScheme`, `ThemeProvider`, `colors`, `shadows`, gradients  
- Biometric UI + privacy/security prompts (`providers/AppSecurityProvider.tsx`, mocked states)  
- Feature-based modular architecture, solo system design

---

## Live Demo Notes

1. Install dependencies and clear cache:  
   ```bash  
   npm install  
   npm start -- --clear  
   ```
2. Exercise UI flows:  
   - Tap the “Need a Nudge?” FAB on Home to open the grounding modal (`components/shared/MicroInteractionButton`, `components/bottom-sheet/BottomSheet.tsx`).  
   - Open Journal to launch the `EditorModal`, switch moods, and trigger AI assist buttons tied to sanitized `services/api/openai.ts`.  
   - Browse Community to react to `PostCard` gradients, open the `CommentSheet`, and feel reaction haptics from `components/community/ReactionBar.tsx`.  
   - Enter Chatbot to observe streaming assistant bubbles, suggested prompts, and auto-journal invitations powered by `useChatPipeline`.  
3. Launch targets:  
   ```bash  
   npx expo run:ios  
   npx expo run:android  
   npm run web  
   ```
4. Copy `.env.example` → `.env` with sanitized Firebase keys (`EXPO_PUBLIC_FIREBASE_*`) and an optional `EXPO_PUBLIC_OPENAI_API_KEY`.  
5. Expo configuration lives in `app.config.js`, and `src/config/env.ts` normalizes env entries for dev + EAS.

---

## Features

- Mood-aware home layout with highlights, quick actions, and responsive tabs (`components/home`, `app/(tabs)`), entirely rendered client-side.  
- Journaling workflow featuring `PromptCarousel`, `MoodTimeline`, AI assist buttons (with mocked outputs), markdown-inspired editor modal with autosave/draft, and mood-adaptive cards.  
- Community feed with curated sections via `useCommunityFeed`, animated `PostCard`, gradient `ReactionBar`, AI summaries, and `CommentSheet` BottomSheet interactions.  
- AI Chatbot orchestrated by `useChatPipeline`, streaming tokens, grounding prompts, and auto-journal suggestions.  
- Settings screen covering appearance, notifications, privacy, AI personalization, biometric toggles, and developer utilities.  
- Gesture-centric utilities (`hooks/gestures`) for swipes, double taps, long presses, and swipe-to-delete.  
- Responsive suite (`useResponsive`, `useBreakpoints`, `scaleSpacing`, `scaleFont`), keyboard-aware scroll handling via `useKeyboardAwareScroll`, and safe-area helpers.  
- Offline queue/cache services (`services/offline/cache.ts`) keep mood, journal, and community writes resilient when the network is unavailable—mocked for portfolio safety.

---

## Screenshots

| Screen | Description |  
| --- | --- |  
| Home | Mood-aware hero, highlights, quick actions, and tab navigation from `components/home`. |  
| Journal | Prompt carousel, mood timeline sparkline, animated journal cards, editor modal flow. |  
| Community | Curated sections with `components/community/PostCard.tsx` reactions. |  
| Chatbot | Streaming assistant bubbles, mood head, grounding prompt, AI assist chips. |  
| Settings | Appearance, notifications, security prompts, and AI personalization panels. |

(Visual assets will be published soon; exported screenshots will land in `/assets` before sharing.)

---

## Deployment & Source

- Client-only repository (no backend/Firebase rules or private infrastructure included).  
- Source folders: `app/`, `features/`, `providers/`, `components/`, `services/`, `hooks/`, `theme/`, plus targeted utilities (`responsive`, `format`, `validation`).  
- Build + preview commands:  
  ```bash  
  expo start --tunnel      # preview across devices  
  npx expo run:ios        # simulator  
  npx expo run:android    # emulator  
  ```  
- Expo SDK 54, Expo Router ~6.0, Reanimated ~4.1, Gesture Handler ~2.28, Firebase 12.6, OpenAI services (mocked for the snapshot).

---

## Privacy & Compliance

- No real user data; OpenAI flows rely on sanitized responses.  
- Secrets supplied via `.env` (`EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_OPENAI_API_KEY`); `src/config/env.ts` normalizes them for dev + EAS.  
- Biometric/screenshot prevention surfaces exist only at the UI level; enforcement depends on the deployed platform.  
- Offline queue/cache service (`services/offline/cache.ts`) keeps writes local until connectivity returns, preserving privacy.  
- Data export flows are UX-only; backend persistence remains proprietary and intentionally excluded.

---

## Portfolio Polish & Cleanup

- Solo dev story emphasized—every module, hook, provider, and screen created by one engineer.  
- Tooling notes: fix npm permissions (`@sigstore/verify` in `/opt/homebrew/lib/node_modules/npm`) before running `npm run lint`, and resolve duplicate `react-native-safe-area-context` versions before using `expo doctor`.  
- Documentation upgrades: `docs/architecture.md`, `docs/data-flow.md`, and this README clarify what is mocked vs. shipped.  
- Screenshot guidance added for future exports (`assets/home.png`, `assets/community.png`).  
- Roadmap: align native dependencies, add Jest/Detox suites, improve offline queue logging, expand docs/diagrams, publish Android & iOS preview builds.  
***
