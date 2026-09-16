# Subs — subscription management app

Self-hosted app that auto-detects subscriptions from Gmail, keeps an oversight
of them, and (eventually) alerts before free trials convert. Monorepo:
`backend/` (NestJS API) + `app/` (React Native / Expo client).

## Current state (already done — don't rebuild)

- **Backend** (NestJS 12, ESM): Prisma 6 + SQLite with `Subscription` and
  `Detection` models. REST API: subscriptions (list/create/delete) and
  detections (list pending / confirm / ignore).
- **Email watcher**: polls Gmail every 2 min, stores new inbox mail as pending
  detections (dedup via Gmail message ID). LIVE and working.
- **App** (Expo SDK 57): three tabs — Home (monthly spend / active / trials +
  upcoming renewals), Subscriptions (list + add modal + delete), Inbox
  (confirm-to-add queue). **FinWise** design language, ported from a Figma
  finance kit: mint-green header (`#00D09E`) bleeding from the status bar with
  a near-white sheet (`#F1FFF3`) riding up over it on a 40px radius, dark teal
  ink (`#093030`), blue category discs, floating bottom tab bar. Poppins +
  League Spartan via `@expo-google-fonts`. All tokens live in
  `app/src/constants/theme.ts` — colours, type, radii and the category→icon
  map. Note `Type` carries `fontFamily` and **no** `fontWeight`: with a custom
  family Android ignores the weight, so pick a `Fonts.*` entry instead of
  overriding weight at the call site.
- **Deferred on purpose**: Clerk auth, LLM classifier (build it behind an
  `EmailClassifier` interface when the time comes), push notifications, 24/7
  launchd deploy.

## Google Cloud / Gmail OAuth — ALREADY SET UP (do NOT redo it)

- Google Cloud project **"Subs"** (number `955257845466`), OAuth client
  **"subs"** (Desktop app type).
- Gmail API **enabled**. OAuth consent screen is in **Testing** mode with
  `albertlund121@gmail.com` as the test user. Redirect URI: `http://localhost`.
- Client ID, client secret, and refresh token live in `backend/.env` on the
  **Mac mini** (that file is gitignored — it is NOT in this repo).
- To mint a fresh refresh token if needed:
  `cd backend && GMAIL_CLIENT_ID=… GMAIL_CLIENT_SECRET=… node scripts/get-gmail-token.mjs`
- Any task touching the email watcher: the OAuth plumbing is already in place.
  Don't scaffold a new Google Cloud project or consent screen.

## Where things run

- **The backend runs on the Mac mini** at `http://192.168.1.47:3000`
  (reachable over the LAN). It is NOT run on this laptop unless you
  deliberately move it.
- The app connects to `http://192.168.1.47:3000` by default
  (override via `EXPO_PUBLIC_API_URL` in an `app/.env`).
- So: when developing the app locally, the mini's backend must be running —
  otherwise the app renders empty/zero data (it doesn't error loudly).

## Commands

```bash
# backend
cd backend && npm install && npm run start:dev   # watch mode
cd backend && node dist/main.js                   # or run built output

# app
cd app && npm install && npx expo start           # then press 'i' for iOS sim
npx expo start --web                              # web preview

# prisma (from backend/)
npx prisma migrate dev --name <name>              # after editing schema.prisma
npx prisma generate
```

## Gotchas

- **NestJS 12 uses ESM** — relative imports need the `.js` extension
  (`import { X } from './x.js'`). Don't drop it.
- **Prisma is pinned to v6** (6.19.x). Do NOT upgrade to 7 or 8 — v7 moved the
  datasource URL out of `schema.prisma`, v8 rewrote the CLI entirely.
- **npm must be ≥ 12** — npm 10.9.8 crashes with
  `Cannot read properties of null (reading 'edgesOut')`. Fix:
  `npm install -g npm@latest`.
- **`backend/.env` is gitignored** — the Gmail OAuth + Clerk secrets never get
  committed. Never add a real secret to version control.
- Every API response is wrapped `{ statusCode, message, data }` (global
  interceptor).
- Auth is currently OPEN (no Clerk guard applied) — fine for local dev.
