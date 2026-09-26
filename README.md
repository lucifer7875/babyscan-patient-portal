# Baby Scan — Ultrasound Report Portal (UI)

Mobile-first patient login for **Baby Scan Fetal Medicine and Gynec imaging**.
Patients enter **Patient ID + First name + Last name** to find their ultrasound reports.

**Stack:** React 19 · TypeScript · Vite · Redux Toolkit · Supabase · Phosphor icons.

```bash
cp .env.example .env   # then fill in the Supabase values
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ with the production security headers
```

## Structure

```
src/
  app/            store.ts, typed hooks
  lib/            supabase.ts (anon client, bucket name)
  features/auth/  LoginPage, authSlice (RTK), validation, reportService (RPC lookup)
  features/reports/ clinicalOrder (dedupe + sort), download (single / ZIP / merged PDF)
  components/     Field, BrandLogo, UltrasoundScene, SuccessPanel (results), DownloadButton, AmbientBackground
  security/       guard.ts (production-only deterrents)
  styles/         global.css (design tokens, light + dark)
```

## API

| What | Where |
| --- | --- |
| Lookup | Supabase RPC `search_patient_report(p_file_id, p_first_name, p_last_name)` → rows with `full_name`, `file_id`, `study_type`, `filename`, `storage_path`, `created_at`, `visit_date` |
| Files | Storage bucket `VITE_SUPABASE_BUCKET` (`patient-reports`) |
| Pre-merged PDF | `reports/{file_id}_COMPLETE_REPORT.pdf` in the same bucket, used by "Download all as one PDF" when present |

Behaviour matches the original portal: duplicate uploads keep the newest, reports are shown in clinical order
(diagnostic → echo → doppler → growth → 3D/4D → 2D), single downloads fall back from Blob → signed URL → public URL,
and bulk downloads skip files that fail. JSZip and pdf-lib are loaded only when a bulk download starts.

Config lives in `.env` (git-ignored). The anon key is Supabase's public key; access control must come from the RPC and
Row Level Security. The CSP `connect-src` is built from `VITE_SUPABASE_URL` in `vite.config.ts`; keep `public/_headers` in sync.

## Security

What the build does:

- **No source maps**, minified output, hashed file names, comments stripped.
- **App code in `src/` is obfuscated** (javascript-obfuscator: control-flow flattening, RC4 string array, dead-code injection, console disabled).
- `index.html` is an empty shell — viewing page source shows only a `<div id="root">` and one script tag.
- Strict **CSP** (`script-src 'self'`, no inline scripts, no `eval`), `X-Frame-Options: DENY`, `nosniff`,
  `no-referrer`, HSTS, locked-down `Permissions-Policy`, `noindex`.
- Inputs are sanitized as the user types (allow-lists + length limits); patient data is kept **in memory only**
  (never in localStorage) and is **wiped after 5 minutes of inactivity**.
- Production-only deterrents: right-click, F12 / Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, Ctrl+P and image dragging are blocked; framing is refused.

Important: a browser has to download the JavaScript to run it, so client code can never be *fully* hidden —
obfuscation and shortcut blocking only raise the effort. Real protection of patient reports must happen on the server:
authenticate every lookup, rate-limit / lock out repeated failures, serve reports via short-lived signed URLs, and log access.

**Deploying:** `public/_headers` works as-is on Netlify / Cloudflare Pages. For nginx, Apache, IIS or Vercel, copy the
same headers into that server's config. The `<meta>` CSP is a fallback, not a replacement.
