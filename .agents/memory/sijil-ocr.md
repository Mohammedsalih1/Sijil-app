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
