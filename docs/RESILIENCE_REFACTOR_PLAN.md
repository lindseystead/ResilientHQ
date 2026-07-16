# ResilientHQ — Evidence-Driven Refactor Plan

> **Goal:** Re-integrate the app's existing features into a cohesive, evidence-based system that
> actually helps people recover from burnout and build resilience — **without losing any of the
> current design, screens, or functionality.** This is a structural + additive refactor, not a
> visual redesign.

Status: proposed · Date: 2026-07-10

---

## 1. Executive thesis

ResilientHQ already contains most of the right ingredients. Its problem is **organization, not
absence**: the strongest feature (the resilience engine — a 7-signal daily check-in that feeds an
adaptive weekly plan, logs interventions, and computes insights) is exactly the
**Measure → Recommend → Do → Reflect → Adapt** loop the evidence supports. But today that loop is:

1. **Device-local and not durable across devices** — derived resilience state lives in AsyncStorage,
   so it can't span devices or be analysed.
2. **Pointed at lower-evidence content** — it mostly schedules _static advice/affirmations_ rather than
   the _active, higher-evidence_ modalities (behavioral activation, CBT reframing, self-compassion,
   psychological detachment, sleep, movement).
3. **Surrounded by siloed, overlapping features** — Advice/SelfCare overlap; mood, journal, and
   check-in are three disconnected writes; AI is gated behind feature flags and not yet integrated
   into the core loop.

**The refactor makes the resilience loop the spine of the product, upgrades what it schedules to
what the evidence says works, unifies the fragmented data/content, and keeps every pixel of the
current design.**

---

## 2. What the evidence says works

Synthesised from four literature reviews (2016–2026 meta-analyses / systematic reviews / large
RCTs). Full citations in **Appendix A**. Effect sizes are reported only where retrieved from source;
all are **ceilings** (mostly waitlist-controlled, self-report) and shrink in real-world use.

### Tier 1 — Best evidence, most digitizable → build these as the core intervention library

| Modality                                                 | Evidence                                              | Effect (as reported)                                    | How it maps into ResilientHQ                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Physical activity / movement**                         | Umbrella review, ~128k people                         | depression −0.43, anxiety −0.42, distress −0.60         | Brief movement / "green break" nudges as an intervention type                                           |
| **Behavioral activation** (pleasant-activity scheduling) | 22-RCT meta-analysis                                  | g ≈ 0.56 (low-bias)                                     | New guided "plan an activity" exercise; the single best low-mood tool                                   |
| **CBT reframing** (thought records)                      | Guided digital-CBT meta-analysis                      | SMD ≈ 0.65 _guided_ (weaker unguided)                   | Reuse the Journal editor as a structured thought-record substrate                                       |
| **Self-compassion** (Neff)                               | 27-RCT meta-analysis                                  | self-criticism g 0.56, rumination g 1.37, stress g 0.67 | Self-kindness / common-humanity exercises — best fit for the self-critical burnout segment              |
| **Psychological detachment** (recovery)                  | 2 meta-analyses, N≈100k+38k                           | detachment ↔ exhaustion r −0.36, ↔ fatigue −0.42        | End-of-workday "shutdown ritual" + boundary/notification tools — **strongest lever for exhaustion**     |
| **Sleep (digital CBT-I)**                                | dCBT-I reviews; sleep↔burnout r 0.34–0.39             | sustained sleep gains                                   | Wind-down + sleep-diary module tied to the check-in "sleep" signal (beats generic "sleep hygiene tips") |
| **Micro-breaks**                                         | RCT meta-analysis                                     | vigor d 0.36, fatigue d 0.35                            | Timed within-day breaks (breathing tool already exists)                                                 |
| **Social connection / peer support**                     | Mortality meta-analysis N>3.4M; app-retention reviews | large health effects; best app retention                | Community is a _recovery pathway_, not a nice-to-have — and it aids retention                           |

### Tier 2 — Real but modest → keep as scaffolding, do **not** headline as clinical claims

- **Mindfulness for stress:** large stress effects, but _small_ for burnout. Good core; don't over-promise.
- **Gratitude ("three good things"):** wellbeing g ≈ 0.19, inflated by waitlist controls. Onboarding habit.
- **Mood tracking:** essentially **neutral** as a standalone intervention. Valuable only as the **data substrate** feeding active tools — never sold as therapy.
- **Expressive journaling:** d ≈ 0.16, null for depression. Keep for expression/engagement.

### Delivery evidence (this shapes _how_ we build, and matters as much as _what_)

- **Apps are a modest adjunct:** depression g ≈ 0.28 vs waitlist, ≈ 0 vs active treatment. **Position honestly; never imply "cure."**
- **Attrition is the central design problem:** ~3.3% 30-day real-world retention. **Front-load value in sessions 1–3.**
- **CBT-grounded + conversational delivery → larger effects**; **symptomatic users show ~2× effects** → target people who actually have elevated burnout.
- **Supportive accountability** (even lightweight/peer) improves adherence.
- **Feature count ≠ efficacy** (mixed evidence). Best-supported trio: **reminders + personalization + self-monitoring**; **peer support + mindfulness** retain best; **gamification does not reliably help**.
- **Highest-leverage burnout drivers are organizational** (Maslach Areas of Worklife: workload, control, reward, community, fairness, values) — an app **cannot** fix these. Honest move: **measure validly, and help users surface structural issues to their org.**
- **Safety:** ~6.7% symptom-deterioration base rate; build **crisis/deterioration pathways**, don't **force high-frequency mood logging** (rumination risk), be **transparent about data**.

### The one-line product principle

> **Measure a real deficit → recommend the specific evidence-based micro-action that targets it →
> guide the user through it → ask if it helped → adapt.** Match the modality to the measured signal;
> be honest about magnitude; design for the user who opens the app five times.

---

## 3. Current state (condensed inventory)

Four mature subsystems: **Community** (full CRUD + moderation), **Chatbot** (streaming AI, crisis
routing — gated behind env flags), **Settings** (broad prefs), and the **Home resilience engine**
(check-in → adaptive plan → interventions → insights). Around them, a **static content cluster**
(Advice, SelfCare, affirmations) and **loosely-coupled trackers** (Mood, Journal).

**Structural problems the refactor must fix (from the feature audit):**

1. **Persistence split** — moods/journals/check-ins are in Firestore, but the _derived_ resilience
   state (plan progress, intervention outcomes, streaks) is AsyncStorage-only → not cross-device, not analysable. **Biggest structural inconsistency.**
2. **Advice ≈ SelfCare** — near-duplicate static-content screens.
3. **Mood ↔ Journal ↔ Check-in are three separate writes** linked only by nav params (Home even
   writes a mood log _and_ a check-in for one action).
4. **Interventions are static content**, not the active modalities the evidence favours.
5. **Duplication:** thin `features/*/services` re-export shims; two Breathing/Grounding
   implementations; mood-emoji arrays copied; multiple affirmation hooks; crisis resources in 3 places.
6. **Mega-screens:** Home 650, Settings 639, Signup 531, Chatbot 511, Journal 499 lines.
7. **Unimplemented scaffolding:** Profile `age/location/bio` do not persist; `premium/`,
   `services/payments`, and `services/api` are empty placeholder directories; `isPremium` is
   hardcoded to false.
8. **Build/CI hardening** (addressed in earlier sessions): Node not pinned (Expo needs 20+), version
   drift, the iOS CocoaPods toolchain needed repair, and the web bundle was not smoke-tested in CI.

---

## 4. Phased plan

Each phase is an independently shippable increment. **Every phase preserves the current visual
design** (theme, components, animations, copy) unless a change is explicitly a _dedupe of true
duplicates_. Phases 0–2 are invisible to users; 3–5 add/rewire capability using the existing design system.

### Phase 0 — Stabilise & lock the foundation _(technical; no user-facing change)_

**Why:** create a safety net before touching structure.

- Commit the already-made fixes on a branch: `babel.config.js`, `exporter.ts` dynamic-import fix,
  `expo-file-system`/`expo-sharing` deps, the `useTypedNavigation` test fix, `.env` key removal, the logo work.
- Pin the toolchain: add `.nvmrc` (20) + `engines.node`; drop/split the CI Node-18 leg that can't bundle.
- `npx expo install --fix` for version drift; document the iOS CocoaPods/Ruby fix.
- **Add a web-bundle smoke test to CI** (`expo export` must succeed) — this exact check would have
  caught the dynamic-import bug that broke every platform.
- **Exit criteria:** `npm run verify` green on Node 20; CI builds the web bundle; branch opened.

### Phase 1 — Unify the data & content model _(structural; invisible)_

**Why:** one coherent spine so the loop can be server-backed and de-duplicated.

- **Migrate derived resilience state to Firestore** — new owner-scoped collections for plan progress,
  intervention events, and streaks (mirror the append-only `resilienceCheckIns` rules pattern), with
  AsyncStorage kept as the **offline cache** via the existing offline queue. Now insights span devices and are analysable.
- **Collapse the compat shims** (`features/mood|journal|community/services`) into direct `domains/*` imports.
- **Single sources of truth:** one mood scale/emoji set (the `MOOD` constant), one
  `BreathingExercise`/`GroundingExercise`, one affirmation hook, one crisis-resources module.
- **Introduce a unified `Practice` (intervention) schema** — every exercise, static _or_ active,
  shares one model `{ id, modality, targetSignal, evidenceTier, durationMin, render }` so the engine can schedule any of them.
- **Exit criteria:** no duplicate logic; derived state round-trips through Firestore; zero visual diff; tests green.

### Phase 2 — Decompose the mega-screens _(maintainability; behavior-preserving)_

**Why:** address "overly complex" without changing behavior.

- Extract controller hooks + sub-components: Home → `useHomeResilience`; plus Signup, Chatbot,
  Journal (Settings already delegates well — light touch).
- Add a **screen-size lint budget** (e.g. warn > 250 lines) and ratchet it, alongside the existing governance scripts.
- **Rule:** pure refactor — snapshot/behavior parity, add component tests as you extract.
- **Exit criteria:** target screens under budget; identical behavior; coverage ≥ current baseline.

### Phase 3 — Build the evidence-based intervention library _(the product core; additive)_

**Why:** point the loop at what actually works. Each Practice targets a measured check-in signal and
reuses the **existing bottom-sheet + design-system** patterns.

- **Detachment:** end-of-workday "shutdown ritual" (brain-dump unfinished tasks + notification/boundary wind-down) → targets _exhaustion_.
- **Sleep:** digital-CBT-I mini-module (wind-down + stimulus-control guidance + sleep diary) tied to the check-in _sleep_ signal.
- **Behavioral activation:** guided pleasant-/values-activity scheduling → targets _low mood/energy_.
- **CBT reframing:** structured thought record (situation → thought → evidence → reframe) built on the Journal editor.
- **Self-compassion:** self-kindness / common-humanity exercises → targets _self-criticism/stress_.
- **Movement & micro-breaks:** brief movement/green-break nudges; timed breaks (reuse breathing tool).
- Keep mindfulness/gratitude/affirmations as honestly-framed scaffolding.
- The **adaptive plan engine already exists** — it now schedules _these_, matched to the user's dominant deficit.
- **Exit criteria:** ≥6 active Practices live, each mapped to a signal + evidence tier; engine schedules by measured deficit; all use current design language.

### Phase 4 — Close the loop with valid measurement _(product core; additive)_

**Why:** measure real burnout, learn what helps each user, stay honest.

- **Validated baseline + periodic re-measure** using PFI or MBI subscales (exhaustion / detachment /
  accomplishment) at **low frequency** to avoid over-tracking/rumination. Feed the engine; show progress.
- **"Did this help?"** already partially exists (`interventions.ts` outcomes) — surface it so the
  engine **weights future recommendations toward what works for this user** (personalization = evidence-supported).
- **Insights** shows measured trends (mood, signals, burnout subscales, "what's working for you").
- **Honest framing + org routing:** "adjunct, not a cure" language; surface workload/control signals
  (Maslach areas) the user can take to their organisation; strengthen crisis/deterioration pathways.
- **Exit criteria:** baseline+re-measure shipped; recommendations adapt to per-user outcomes; insights reflect valid measures; honest-positioning copy in place.

### Phase 5 — Cohesion, retention & safety polish

**Why:** remove silos, respect attrition, harden safety — keeping all content.

- **Merge Advice + SelfCare** into one "Practices" surface (keeps every piece of content; removes the duplicate screen) and promote the new library.
- **IA:** make the resilience loop the spine of Home and surface the high-evidence tools that are currently buried in the Home stack.
- **Retention (evidence-led):** front-load value in the first 3 sessions; gentle personalised
  reminders (best-supported); optional **peer/community accountability** (best retention + a recovery
  pathway). **No gamification crutch.**
- **Safety/data:** one crisis-resource source; stronger deterioration detection; transparent, minimal data handling.
- **Loose ends:** persist Profile fields via a real user-profile doc; **decide Premium** — build a
  minimal entitlement layer _or_ remove the empty `premium/`, `services/payments`, `services/api` dirs.
- **Exit criteria:** no duplicate screens; resilience loop is the primary IA; retention hooks + safety pathways in place; no empty placeholder directories.

---

## 5. What we will deliberately NOT do (anti-patterns from the evidence)

- ❌ Market mood tracking, gratitude, or journaling as _treatments_ (they're neutral/small).
- ❌ Add gamification as a retention crutch (unreliable in the evidence).
- ❌ Force high-frequency mood/burnout logging (rumination + deterioration risk).
- ❌ Imply self-help resolves system-driven burnout (highest-leverage drivers are organizational).
- ❌ Redesign the visual language, remove screens, or drop existing content.

## 6. Design-preservation guarantees

- Theme tokens, components, gradients, animations, and copy are **unchanged**; the `lint:design`
  token gate stays enforced.
- The only _feature_ consolidation is Advice + SelfCare (a true duplicate) — **all content is retained** in the merged surface.
- Every new Practice is built from the **existing** bottom-sheet, card, and input components.
- Phases 0–2 are provably visual-no-ops (snapshot parity); 3–5 are additive within the current system.

## 7. Sequencing, risk & measurement

- **Order matters:** 0 (safety net) → 1 (spine) → 2 (decompose) unlock 3–5 safely. Do not start Phase
  3 before the `Practice` schema (Phase 1) exists.
- **Biggest risk:** the AsyncStorage→Firestore migration (Phase 1) — mitigate with dual-write + read-through cache and a one-time backfill; gate behind the offline queue that already exists.
- **Instrument real engagement** (retention, DAU, module completion) from Phase 1 so decisions use
  real-world use, not trial assumptions.
- **Keep `npm run verify` green at every phase**; treat the web-bundle smoke test as a required check.

---

## Appendix A — Key sources (retrieved, peer-reviewed)

**Burnout / healthcare workers**

- Panagioti et al., _JAMA Internal Medicine_ 2017 — org- vs individual-directed (SMD −0.45 vs −0.18).
- Tamminga et al., _Cochrane_ 2023 — 117-study individual-level review; benefit up to ~1 yr.
- West, Dyrbye, Erwin, Shanafelt, _The Lancet_ 2016 — physician burnout interventions.
- Individual-focused physician MA, _Medicina (Kaunas)_ 2025 — coaching/mindfulness/peer support.
- Leiter & Maslach 1999 — Six Areas of Worklife model.
- Trockel et al., _Academic Psychiatry_ 2018 — Professional Fulfillment Index; NAM 2019 measurement.

**Recovery science**

- Headrick et al., _J Business & Psychology_ 2022 — recovery-experiences meta-analysis (N≈99k).
- Wendsche & Lohmann-Haislah, _Frontiers in Psychology_ 2016 — detachment meta-analysis (N≈38k).
- Albulescu et al., _PLOS ONE_ 2022 — micro-breaks (vigor d 0.36, fatigue d 0.35).
- Sleep–mental-health MA, _Frontiers in Psychiatry_ 2022; digital CBT-I reviews 2024–25.
- Holt-Lunstad et al., _Perspectives on Psych. Science_ 2015; _World Psychiatry_ 2024 — social connection.

**Individual modalities**

- Singh et al., _Br J Sports Medicine_ 2023 — physical activity umbrella review.
- Ferrari et al., _Mindfulness_ 2019 — self-compassion (27 RCTs).
- Individual behavioral-activation MA, _Psychotherapy Research_ 2023 (g ≈ 0.56).
- Guided digital CBT for depression, _BMC Psychiatry_ 2022 (SMD ≈ 0.65 guided).
- Mood-monitoring RCT MA, _JMIR Mental Health_ 2026 — largely neutral.
- Gratitude cross-cultural MA, _PNAS_ 2025 (g ≈ 0.19); expressive-writing review, PMC 2023.

**Digital delivery / attrition / design**

- Linardon, Torous, Firth et al., _World Psychiatry_ 2024 — 176-RCT app meta-analysis (dep g 0.28; ~0 vs active).
- Baumel et al., _JMIR_ 2019 — real-world engagement (3.3% 30-day retention); Eysenbach _JMIR_ 2005 — Law of Attrition.
- Wu et al., _npj Digital Medicine_ 2021 vs Valentine et al., _npj Digital Medicine_ 2025 — mixed evidence on persuasive design.
- Werntz et al., _JMIR_ 2023 + Mohr et al., _JMIR_ 2011 — supportive accountability.
- Gega et al., _npj Digital Medicine_ 2024 — adverse events (6.7% deterioration base rate).

> **Honesty note:** effect sizes are ceilings (mostly vs waitlist, self-report); real-world app
> effects are smaller. None of these studies tested _this_ app — the "app translation" mappings are
> reasoned from mechanism, and the plan positions ResilientHQ as an evidence-informed **adjunct**.
