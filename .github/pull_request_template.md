## Summary

<!-- What changed and why -->

## Risk

<!-- Behavior, migration, security, or data risks -->

## Validation

<!-- Paste exact commands and outcomes -->

```bash
npm run verify
```

## Screenshots / Recordings (if UI changed)

<!-- Include device/viewport notes -->

## Checklist

- [ ] Architecture boundaries respected (`npm run lint:architecture`)
- [ ] Import graph remains acyclic (`npm run lint:cycles`)
- [ ] Design token rules pass (`npm run lint:design`)
- [ ] Firestore governance checks pass (`npm run lint:firestore`)
- [ ] Dependency + unused file checks pass (`npm run deps:check`, `npm run unused:files`)
- [ ] Tests and coverage gates pass (`npm run test:ci`, `npm run coverage:ratchet`)
- [ ] Docs updated for behavior/env/API changes
