# Safety Guardrails Audit (2026)

Last reviewed: July 11, 2026

This document maps current AI chatbot safety controls in this repository to external standards and recent research relevant to resilience-focused and mental-health-adjacent mobile experiences.

> **Adversarial review (July 2026).** The chatbot was reviewed end-to-end against the failure modes below and hardened accordingly: crisis detection was broadened to high-recall matching (normalized for case/whitespace/diacritics) and now scans every user turn on the server, not only the last message; the output self-harm/violence filter runs unconditionally (a refusal phrase can no longer suppress it); output semantic moderation and non-wildcard CORS are now **required** (hard error) in production; the rate limiter keys only on a verified user id or network address, never a client-supplied field; and client error responses are generic (provider detail is logged server-side only). The remaining, honestly-stated limitations are in [Residual Gaps](#residual-gaps-to-close).

## Sources Reviewed

- OpenAI Safety Best Practices: <https://platform.openai.com/docs/guides/safety-best-practices>
- OpenAI Moderation Cookbook Example: <https://cookbook.openai.com/examples/how_to_use_moderation>
- OWASP Top 10 for LLM Applications (2025): <https://owasp.org/www-project-top-10-for-large-language-model-applications/>
- JMIR (2025) human–chatbot escalation for mental health support: <https://www.jmir.org/2025/1/e65486/>
- PubMed indexed review on LLMs for mental health interventions: <https://pubmed.ncbi.nlm.nih.gov/39807887/>
- npj Digital Medicine (2025) evaluation of response quality for users with mental health conditions: <https://www.nature.com/articles/s41746-024-01480-z>

Mental-health chatbot–specific frameworks:

- **VERA-MH** (Validation of Ethical and Responsible AI in Mental Health), Spring Health + Expert Council, 2025 — open-source crisis-handling evaluation rubric: <https://www.vera-mh.com/> · <https://arxiv.org/abs/2510.15297>
- APA (American Psychological Association) health advisory on AI chatbots & wellness apps (Nov 2025): <https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps>
- 988 Suicide & Crisis Lifeline best practices: <https://988lifeline.org/professionals/best-practices/>
- WHO ethics & governance of AI for health — Large Multi-Modal Models (Jan 2024): <https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models>

## Control Mapping

### 1) Layered input safety (before provider call)

- Local crisis language detection and escalation messaging.
- Locale/country-aware crisis escalation routing (when context is available).
- Prompt injection detection and sanitization.
- Contact/PII redaction before forwarding.
- Optional semantic moderation of the latest user message.

Implementation:

- `server/ai-proxy/crisis.js`
- `server/ai-proxy/safety.js`
- `server/ai-proxy/app.js`
- `src/domains/ai/safetyContext.ts`

### 2) Layered output safety (sync + streaming)

- Heuristic blocking for unsafe self-harm/violence instructions.
- Optional semantic moderation of assistant output.
- Buffered stream release with pre-release safety checks.
- Stream semantic moderation cadence control (`AI_PROXY_SEMANTIC_MODERATION_MIN_CHARS`) and forced final-flush moderation.
- Fail-closed option for moderation unavailability.

Implementation:

- `server/ai-proxy/app.js`
- `server/ai-proxy/config.js`

### 3) Abuse resistance and platform controls

- Model allowlisting.
- Auth enforcement + optional Firebase token verification (fail-closed when required verification is unavailable).
- Rate limiting with support for external shared stores.
- CORS origin allowlisting.
- Structured audit logging with safety metadata.

Implementation:

- `server/ai-proxy/config.js`
- `server/ai-proxy/auth.js`
- `server/ai-proxy/rateLimit.js`
- `server/ai-proxy/http.js`
- `server/ai-proxy/provider.js`

## Mental-Health Chatbot Framework Alignment

How the implemented controls map to the leading mental-health chatbot evaluation
frameworks. VERA-MH is an evaluation _methodology_ (a simulated-conversation test
harness), not a checklist to "comply" with; the table states how the current
design would fare against its clinician rubric, and is honest about what is
intentionally out of scope for a **non-clinical support tool**.

### VERA-MH rubric (suicide-risk handling)

| Dimension                     | Status                   | How                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Detects Risk**              | Implemented              | Deterministic, high-recall crisis detection on client and server, normalized. The server enforcement point scans every user turn in the request (`safety.js`); the client checks the current message before send (`guardrails.ts`). Limitation: keyword-based, so novel/indirect phrasing can be missed; semantic moderation is the backstop. |
| **Probes Risk**               | Out of scope (by design) | The app deliberately does **not** perform clinical risk assessment. On detection it routes to resources rather than interviewing the user about suicide risk — appropriate for a non-clinical tool, but a VERA-MH gap to state plainly.                                                                                                       |
| **Takes Appropriate Actions** | Partial                  | Surfaces real, locale-aware crisis resources deterministically before any model call. Gap: no automated human/clinician escalation (`shouldEscalate` is surfaced but not acted on).                                                                                                                                                           |
| **Validates & Collaborates**  | Implemented              | Crisis message validates and invites one small collaborative step (`crisis.js`); trauma-safe mode softens tone.                                                                                                                                                                                                                               |
| **Maintains Safe Boundaries** | Implemented              | Never provides means/methods (system prompt + unconditional output filter); identifies as "not a crisis service"; no diagnosis/treatment claims.                                                                                                                                                                                              |

### Broader consensus (APA 2025, WHO LMM, 988, OpenAI)

- **AI-identity disclosure** — implemented: persistent header disclosure (`AI_DISCLOSURE_NOTICE`) plus explicit self-identification in the system prompt.
- **Non-clinical framing / no impersonation of a clinician** — implemented (system prompt + disclosures + README/DISCLAIMER).
- **Hardcoded, non-disableable crisis pathway** — implemented (deterministic, pre-model).
- **Anti-sycophancy / do not reinforce delusions or harmful beliefs** (the top APA/Brown-2025 failure mode) — implemented in the system prompt.
- **Substantiate health claims** — addressed: efficacy claims softened to non-clinical wording.
- **Human oversight & escalation; minors/youth protections; independent post-deployment audit; formal VERA-MH evaluation run** — not implemented; see Residual Gaps.

## Residual Gaps To Close

- **Streaming semantic-moderation window.** The per-token heuristic gate runs on every released chunk, but OpenAI semantic moderation only begins once a stream reaches `AI_PROXY_SEMANTIC_MODERATION_MIN_CHARS` (default 240), so the first window of a streamed response is covered by the heuristic gate alone. Lower the threshold or run a first-chunk semantic pass for stricter deployments.
- **Crisis patterns are mirrored, not shared.** The client (`src/features/chatbot/utils/guardrails.ts`) and server (`server/ai-proxy/safety.js`) keep parallel pattern lists because they run in different runtimes; a parity test (`__tests__/services/aiProxyCrisisSafety.test.js`) guards against drift, but there is no single source of truth.
- **System prompt is client-supplied.** The safety persona is built on the client and sent with the request; the server does not inject its own authoritative safety system message, so it relies on server-side moderation/crisis gates as the hard control for non-standard clients.
- Expand crisis routing coverage beyond currently supported countries (`US`, `CA`, `GB`, `IE`, `AU`, `NZ`), and detection beyond English/Spanish. Both the Help screen and the in-chat crisis sheet already share the same locale/country-aware routing (`resolveCrisisSupportRouting`).
- Human escalation handoff integration (live counselor or clinical escalation queue). The `shouldEscalate` flag is surfaced in responses/audit logs but has no automated human-notification path.
- Continuous red-team benchmark suite for jailbreak and self-harm edge cases across languages.
- Safety telemetry dashboards for trend monitoring (blocked-rate, escalation-rate, moderation error-rate).
- **Minors / youth protections** — the app is stated to be for adults, and the assistant is instructed to respond age-appropriately and encourage involving a trusted adult if a user self-identifies as a minor. There is still **no age assurance** (a stated expectation of the APA advisory and OpenAI teen-safety guidance).
- **Formal VERA-MH evaluation run** — the design maps to the VERA-MH rubric, but the simulated-conversation evaluation harness has not been run against the assistant. Running it (and clinical review) would be required before any real deployment.

## Scope Note

These controls reduce risk but do not establish medical-device compliance or clinical efficacy on their own. Production release should include legal/compliance review, human escalation operations, and ongoing incident monitoring.
