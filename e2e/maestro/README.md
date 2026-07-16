# Maestro E2E Flows

This folder contains device-level E2E flows for high-risk mobile paths.

## Prerequisites

1. Install Maestro CLI:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

2. Build and install the app on a simulator/device.

3. Start the device emulator/simulator.

## Run Smoke Flow

```bash
npm run e2e:maestro:smoke
```

Optional overrides:

```bash
MAESTRO_APP_ID=com.lindsea89.resilientportfolio npm run e2e:maestro:flow -- e2e/maestro/flows/smoke_auth.yaml
```

## Current Flows

- `flows/smoke_auth.yaml`: app launch + auth navigation smoke test.
