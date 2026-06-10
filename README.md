# arca-sdk monorepo

This repository is organized as a pnpm + Turbo monorepo.

## Workspaces

- `packages/core` — the TypeScript ARCA/AFIP SDK package (`@arca-sdk/javascript`).
- `apps/website` — a TanStack Start web app with a GUI for creating invoices through the SDK.
- `apps/react-native` — reserved for the future Android/React Native app. It is intentionally empty for now.

## Commands

```sh
pnpm install
pnpm build
pnpm check
pnpm test
pnpm dev
```

You can also target a single workspace:

```sh
pnpm --filter @arca-sdk/javascript build
pnpm --filter @arca-sdk/website dev
```

See `apps/website/.env.example` for the environment variables required by the invoice GUI.
