---
name: Sijil notification OCR
description: How the Gemini-Vision notification reading works in the سِجِل app and its non-obvious constraints
---

# سِجِل — notification image OCR (Gemini Vision)

Frontend (`@workspace/sijil`) posts a compressed image to `POST /api/ocr` (served by `@workspace/api-server`), which calls Gemini `gemini-2.5-flash` and returns strict JSON `{transactionLast4, amount, accountNumber, notificationType}`.

**Non-obvious constraints:**
- The browser fetch uses the **absolute** path `/api/ocr`. This is correct here because api-server is a separate artifact mounted at domain-root `/api` by the shared proxy — it is NOT the sijil app's own base path. Do not "fix" it to a BASE_URL-relative path.
- Image payloads exceed Express's default 100kb body limit → `app.ts` sets `express.json({ limit: "20mb" })` AND the client compresses (resize max 1280px, JPEG 0.82) before upload. Both are required to avoid HTTP 413.
- Requires `GEMINI_API_KEY` secret.
- **Never log the raw Gemini response text** — it contains extracted financial/account PII. Log only metadata (e.g. `responseLength`).
- `transactionLast4` is normalized to last-4-digits on BOTH server (`slice(-4)`) and client for all three notification types (بنكك/فوري/أوكاش).

**UX contract:** clicking "إضافة عملية" for a NEW op opens a capture-first step (type selector + camera/gallery buttons), not the form directly. Successful OCR advances to the prefilled form for review; "أو أدخل البيانات يدوياً" skips to manual entry. Save path is the existing LocalStorage logic, unchanged.

## Deployment: app is dual-target (Replit AND Vercel)
**Decision:** the frontend must call **relative** `/api/ocr` so the SAME build works on both hosts — never hardcode an absolute API URL. The backend for that path is provided differently per host:
- **Replit** runs the real Express `@workspace/api-server` and the shared proxy routes `/api` to it. Static frontend is served from `dist/public` (artifact.toml), so Vite `build.outDir` must stay `dist/public`.
- **Vercel** has NO Express server — only static files + serverless functions — so `/api/ocr` 404s unless a repo-root `api/*` serverless function exists. It mirrors the Express route.

**Why the OCR backend can't be skipped on Vercel:** `GEMINI_API_KEY` must stay server-side; the browser can't call Gemini directly.

**Gotchas when touching Vercel deploy:**
- Serverless deps must be in the **root** `package.json` (a root `api/*` fn can't resolve a dep installed only under `artifacts/api-server`).
- `vercel.json` `outputDirectory` must track any change to Vite's `outDir`.
- User must set `GEMINI_API_KEY` in the Vercel dashboard env vars themselves — it is not synced from Replit secrets.
