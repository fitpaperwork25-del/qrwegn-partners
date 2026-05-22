# QR-Wegn Partner Portal — Project Architecture

## Overview

Internal partner management platform for the QR-Wegn network. Admins manage partners through a pipeline; partners access their own onboarding portal.

---

## Frontend Stack

| Item | Detail |
|------|--------|
| Framework | React 18 (Vite) |
| Routing | Manual state-based (`page` state in `App.jsx`) |
| Styling | Inline styles (dark navy theme) — except `MaterialsPage.jsx` which uses Tailwind |
| Auth | Supabase Auth (`signInWithPassword`) |
| Database client | `@supabase/supabase-js` |
| Build tool | Vite 5 |
| Package manager | npm |

---

## Deployment

| Item | Detail |
|------|--------|
| Platform | Vercel |
| Production URL | https://qrwegn-partners.vercel.app |
| GitHub repo | https://github.com/fitpaperwork25-del/qrwegn-partners |
| Branch | `master` |
| Supabase project | `yizvlbupvamsietgjtys.supabase.co` |

---

## Supabase Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User roles and partner linkage | `id`, `role` (admin/partner), `partner_id`, `full_name` |
| `partners` | Partner pipeline records | `id`, `full_name`, `email`, `phone`, `territory`, `languages`, `source`, `stage`, `market_tier`, `commission_rate` |
| `communications` | Interaction log per partner | `id`, `partner_id`, `type`, `notes`, `created_at` |
| `training_assignments` | Training tasks per partner | `id`, `partner_id`, `title`, `description`, `status` |
| `outreach_materials` | Sales/onboarding assets | `id`, `title`, `description`, `type`, `file_url`, `created_at` |

---

## Supabase Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `partner-materials` | PDFs, decks, videos for outreach materials |

---

## Application Pages

| Page | File | Access | Data Source |
|------|------|--------|-------------|
| Login | `LoginPage.jsx` | Public | Supabase Auth |
| Admin Dashboard | `AdminDashboard.jsx` | Admin | `partners` table |
| Partners List | `PartnersPage.jsx` | Admin | `partners` table |
| Partner Profile | `PartnerProfile.jsx` | Admin | `partners`, `communications`, `training_assignments` |
| Training | `TrainingPage.jsx` | Admin | Static (not yet wired) |
| Materials | `MaterialsPage.jsx` | Admin | `outreach_materials` table |
| Partner Portal | `PartnerPortal.jsx` | Partner | Static (not yet wired to Supabase) |

---

## Completed Features

- [x] Login with Supabase Auth (admin/partner mode toggle)
- [x] Forgot password with redirect to production URL
- [x] Admin dashboard with live partner counts and pipeline overview
- [x] Partners list loaded from Supabase with search and stage filter
- [x] Add Partner modal — saves to Supabase `partners` table
- [x] Partner profile page loaded from Supabase by `partner_id`
- [x] Stage dropdown updates Supabase in real time
- [x] Communication tab — log and load interactions from Supabase
- [x] Training tab — loads from `training_assignments` (RLS must be enabled)
- [x] Outreach materials page loaded from Supabase
- [x] Dark high-contrast UI theme across all pages
- [x] Deployed to Vercel with Supabase env vars

---

## Known Issues / In Progress

- [ ] `MaterialsPage.jsx` uses Tailwind — inconsistent with the rest of the app's inline style theme
- [ ] Training tab shows empty if RLS policy not set on `training_assignments`
- [ ] `PartnerPortal.jsx` (partner-facing) still uses static/mock data
- [ ] `TrainingPage.jsx` (admin view) not yet wired to Supabase
- [ ] No file upload UI for outreach materials yet

---

## Next Priorities

1. Fix RLS on `training_assignments` so training tab renders live data
2. Wire `PartnerPortal.jsx` to Supabase (real partner data on login)
3. Wire `TrainingPage.jsx` to Supabase
4. Add file upload to Materials page
5. Unify `MaterialsPage.jsx` styling to match dark theme
6. Add pagination or load-more to Partners list
