# Features

Feature specs and decisions for the **Subs** app. Each entry records the
approach chosen now, plus the alternatives deliberately deferred so the
reasoning isn't lost.

---

## Active cancellation — cancel a subscription at the source

**Goal.** Let the app actually cancel a subscription at the external platform
(Spotify, Netflix, HBO, …) — not just remove the local record. (Local delete
already exists: `DELETE /subscriptions/:id`, plus a Delete action in the app.)

**Key constraint.** Spotify, Netflix and HBO (Max) expose **no public "cancel"
API**. No endpoint exists that a third party can hit to cancel them. "Active
cancellation" therefore has to go through one of the mechanisms below.

### Decision — Option A: guided deep-link (chosen for now)

- Data-driven catalog: `service → { cancelUrl, steps[] }`.
- "Cancel" opens the vendor's own cancellation page in a browser and shows a
  step-by-step "where to click" guide. The user finishes the final click.
- **"Cancel upon trial end"** toggle (yes/no) shown when confirming a
  subscription. When yes, the app schedules a reminder at `trialEndsAt` that
  deep-links straight to the cancel page.
- Why A: works for every service, stores no credentials (no security surface,
  GDPR-clean, store-safe), no ToS risk, cheap to maintain, passes App Store /
  Google Play review.

### Deferred — Option C: browser automation (saved for later)

- Headless browser (Playwright/Puppeteer) logs in as the user and clicks
  "cancel" server-side. The only mechanism where cancellation is fully
  hands-free.
- **Blocked for now on the security aspect** — it means storing the user's
  Netflix/Spotify/HBO **passwords** on the mini. High-value secret liability
  (encryption-at-rest, secret manager, breach risk). Too big to take on right
  now.
- Also: fragile (sites change DOM / bot-detect / 2FA), ToS-risky (risk of
  account suspension), and a likely App Store / Play rejection magnet.
- Revisit only if/when the credential-security work is worth doing.

### Deferred — Option B: cancel-by-email

- Reuses the existing Gmail OAuth to send cancellation emails to services that
  accept cancellation that way (gyms, newspapers, niche SaaS). Truly active,
  but Spotify/Netflix/HBO generally don't accept it. Candidate enhancement
  later.

### Open questions

- "Cancel upon trial end" only has a target date for trials. For non-trial
  subscriptions, does the toggle mean "cancel at next renewal", or is it
  trial-only?
- "All apps" = a growing `service → guide` catalog, not literally every service
  (some can't be cancelled by any external means). Start with Spotify, Netflix,
  HBO.

---

## Shipping & scale notes (future)

Raised while scoping active cancellation — relevant when the app moves past a
single self-hosted user:

- **Auth is currently un-scoped.** Every query is a bare `findMany()` across the
  whole DB. Multi-user needs a `userId` on every model + a guard, or data leaks
  between users. Biggest refactor, larger than this feature.
- **Gmail is single-user today** (hardcoded to one refresh token). Multi-user =
  per-user OAuth + per-user polling.
- **App Store / Play:** deep-linking to a vendor's cancel page is fine;
  credential-vaulting + automating other services is a rejection/flag risk.
  Play needs a privacy policy URL + data-safety form (+ in-app account deletion
  once there are accounts).
- **GDPR scales** once other people's email/subscription data is held: DPIA,
  breach notification, right-to-erasure, DPAs.
