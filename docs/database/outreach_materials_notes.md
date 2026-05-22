# Outreach Materials — Database Notes

Supabase table: `public.outreach_materials`

Loaded in `src/pages/MaterialsPage.jsx` via:
```js
supabase.from("outreach_materials").select("*").order("title")
```

---

## Table Schema (expected columns)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Auto-generated primary key |
| `title` | text | Display name of the material |
| `description` | text | Short description shown under title |
| `type` | text | e.g. PDF, Video, Deck, Script |
| `file_url` | text | Public URL to the file (Supabase Storage or external) |
| `created_at` | timestamptz | Auto-generated |

---

## Known Materials

| Title | Filename | Purpose | Upload Status | Supabase Storage Path | Public URL | Created |
|-------|----------|---------|--------------|----------------------|------------|---------|
| Partner Pitch Deck | partner-pitch-deck.pdf | Overview deck for prospective partners | Pending | `partner-materials/partner-pitch-deck.pdf` | TBD | — |
| Restaurant Onboarding Script | onboarding-script.pdf | Step-by-step script for onboarding a restaurant | Pending | `partner-materials/onboarding-script.pdf` | TBD | — |
| QR-Wegn One-Pager | qrwegn-one-pager.pdf | Single-page summary of the platform | Pending | `partner-materials/qrwegn-one-pager.pdf` | TBD | — |
| Partner Overview Deck | partner-overview-deck.pdf | Shared with partners during onboarding | Pending | `partner-materials/partner-overview-deck.pdf` | TBD | — |
| QR-Wegn Demo Video | demo-video.mp4 | Live demo walkthrough | Pending | `partner-materials/demo-video.mp4` | TBD | — |
| Commission Structure | commission-structure.pdf | Commission tier breakdown | Pending | `partner-materials/commission-structure.pdf` | TBD | — |

---

## Notes

- Files should be uploaded to the `partner-materials` Supabase Storage bucket.
- Each file's public URL should be inserted into `outreach_materials.file_url`.
- RLS: Authenticated users need SELECT access. Add policy if not set:
  ```sql
  CREATE POLICY "auth read outreach_materials" ON outreach_materials
    FOR SELECT TO authenticated USING (true);
  ```
- The `MaterialsPage.jsx` uses Tailwind CSS classes — this page diverges from the inline-style dark theme used elsewhere.
