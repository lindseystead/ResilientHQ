# Privacy

This repository is source code for a mobile app. If deployed against real infrastructure, it would handle:

- **Account data** — email and display name, via Firebase Authentication.
- **User-generated wellbeing content** — mood logs, journal entries, daily check-ins, and community posts/comments, stored in Cloud Firestore.
- **AI chat messages** — only if AI features are explicitly enabled. Messages are routed through a first-party proxy to a third-party AI provider (e.g. OpenAI). The mobile client never holds the provider's API key.

## What this repository implements

- AI features ship **disabled by default** (`EXPO_PUBLIC_AI_FEATURES_ENABLED=false`).
- Firestore security rules restrict each user's private data to that user (see [`firestore.rules`](./firestore.rules)).
- **Account deletion removes the user's private data** from Firestore before the auth account is deleted.
- No secrets are committed; `.env` is gitignored and CI runs secret scanning.

## Contact

Open a GitHub issue for privacy questions about this project.
