---
name: Sijil activation & trial gate
description: How the client-side trial/activation licensing works in the LocalStorage-only Sijil PWA, and its deliberate tradeoff.
---

# Sijil activation / trial gate

Access gating lives entirely client-side (LocalStorage-only app, by user's explicit design).

## Code algorithm (source of truth — do not reinvent)
- Code = SHA-256 of `${deviceId}|${duration}|SIJIL_SECRET_2026`, take first 8 hex chars, uppercase, format `SJL-XXXX-XXXX`.
- Durations: 30 / 90 / 365 days. Verify tries all three; the matched duration sets `sijil_expires_at = now + days`.
- Device ID: `DEV-XXXXXX` (6 uppercase hex), created once and persisted in `sijil_device_id`.
- Same algorithm can be run externally with Node `crypto.createHash("sha256")` to mint codes for a given Device ID.

## Access state machine (App.tsx `getAccessStatus`)
- `sijil_expires_at` present → activated if `now < expiresAt`, else expired (subscription re-locks on lapse).
- legacy `sijil_activated === "true"` with no expiry → permanent activated (back-compat).
- else trial via `sijil_trial_start`; `TRIAL_MINUTES` (currently 5, intentionally short for testing — bump for production).
- A 10s interval re-locks the Home screen mid-session once trial/subscription expires.
- Malformed timestamps fail closed to "expired" (safe).

## Deliberate tradeoff
- **Why:** user specced a LocalStorage-only app with client-side code generation. So the signing secret ships in the frontend and `sijil_expires_at`/`sijil_activated` are user-editable — the gate is a soft UX lock, NOT real license enforcement. This is expected, not a bug.
- **How to apply:** if the user ever wants tamper-proof licensing, move issuance/verification to `@workspace/api-server` (signed tokens); do not embed the secret client-side. Never delete user operations/data on expiry — only gate navigation.
