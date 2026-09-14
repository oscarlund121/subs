# Subs

See every subscription you pay for in one place. Subs reads the receipts and
renewal notices already sitting in your email, works out what you are paying
and when it renews, and asks you to confirm before tracking it.

- `backend/` — NestJS API, Prisma, and the email-detection pipeline
- `app/` — Expo (React Native) client

## How detection works

```
Gmail  ──►  targeted search   ──►  parser        ──►  Detection (pending)
            (receipts, invoices,   merchant, price,        │
             renewals, trials)     cycle, dates,           │  you confirm
                                   confidence              ▼
                                                     Subscription
```

1. **Search.** The watcher queries Gmail for billing-shaped mail only
   (`gmail.service.ts`), rather than scanning the whole inbox.
2. **Parse.** Each new message goes through `SubscriptionParserService`, which
   identifies the merchant, amount, currency, billing cycle, renewal date and
   any free trial, and scores its own confidence. English and Danish.
3. **Review.** Anything it is confident enough about lands in the app's Inbox
   tab. Everything else is recorded as `filtered` so it is never re-fetched, and
   never shown.
4. **Confirm.** You accept it as-is or correct it first. Confirming a service
   already tracked updates that subscription instead of adding a duplicate.

Email bodies are parsed in memory and never written to the database — only the
extracted fields and Gmail's own short snippet are stored.

## Running it

### Backend

```bash
cd backend
npm install
cp .env.example .env          # fill in Gmail credentials to enable detection
npx prisma migrate dev        # creates prisma/dev.db
npm run start:dev             # http://localhost:3000
```

Without Gmail credentials everything still runs — the watcher logs that it is
idle and you can add subscriptions by hand.

### App

```bash
cd app
npm install
echo "EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000" > .env
npm start
```

A physical device needs your machine's LAN IP, not `localhost`.

## API

| Method | Path | |
|---|---|---|
| `GET` | `/subscriptions` | all tracked subscriptions, soonest renewal first |
| `GET` | `/subscriptions/:id` | one subscription |
| `POST` | `/subscriptions` | add manually |
| `PATCH` | `/subscriptions/:id` | edit any field |
| `DELETE` | `/subscriptions/:id` | remove |
| `GET` | `/detections` | pending detections, most confident first |
| `POST` | `/detections/:id/confirm` | track it; body may carry corrections |
| `POST` | `/detections/:id/ignore` | dismiss |
| `POST` | `/email/poll` | scan now; returns `{ scanned, detected, filtered }` |
| `GET` | `/health` | liveness |

Responses are wrapped: `{ statusCode, message, data }`.

## Scheduled work

- **Email poll** — every 2 minutes. The first run backfills up to 200 messages
  from the last year; later runs look at the last 14 days.
- **Renewal roll-forward** — daily at 03:00. Moves renewal dates that have
  passed on to the next period and converts finished trials to `active`.

## Tests

```bash
cd backend && npm test
```

The parser carries the bulk of the coverage: extraction from real receipt
shapes, rejection of newsletters and one-off purchases, currency and date
formats, and the confirm/dedupe rules.

## Not built yet

- **Accounts.** There is no `User` model; data is global and Gmail access is one
  refresh token in `.env`, so it reads one mailbox. `ClerkAuthGuard` verifies
  tokens correctly but is not applied globally — that lands with the User model.
- **In-app Gmail connect.** Today you run `scripts/get-gmail-token.mjs` by hand.
- **Notifications** before a trial converts or a renewal hits.
- **Price history** and actual charge events, so "Spotify went up" is visible.
- **Money as integers.** Prices are `Float`; they should be minor units.
- **Bank transactions** as a second signal, for subscriptions with no email.
- **Postgres**, Docker and CI. SQLite is a local-development choice.
