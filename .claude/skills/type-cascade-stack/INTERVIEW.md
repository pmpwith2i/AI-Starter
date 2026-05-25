# Interview script

Run these five `AskUserQuestion` rounds **in order**. After every round, write the answers into `.claude/bootstrap-answers.json` so subsequent agents can read them. Do not infer answers. Do not batch — one round at a time, waiting for the user.

If the user says "skip the interview, use defaults", populate `.claude/bootstrap-answers.json` with the defaults shown in the placeholders below and proceed straight to bootstrap.

## Round 1 — Project identity

```
question: "What's the project name and one-line pitch?"
header: "Project"
multiSelect: false
options:
  - "Custom name + pitch (write in notes)" / "User provides project_name and one_liner via the Other field"
  - "Untitled MVP" / "Use placeholder name + pitch — the user wants to defer"
```

Persist:
```json
{ "project_name": "...", "one_liner": "..." }
```

## Round 2 — Domain + audience

```
question: "What's the primary domain (the thing the app is FOR), and who's the user?"
header: "Domain"
multiSelect: false
options:
  - "Healthcare patient platform" / "Patients managing chronic conditions, treatments, wellness"
  - "Healthcare professional tool" / "Clinicians, dietitians, therapists managing caseloads"
  - "Consumer wellness / lifestyle" / "Self-improvement, fitness, nutrition for general public"
  - "B2B SaaS / internal tool" / "Knowledge workers, internal ops, dashboards"
```

Then a follow-up:
```
question: "What is the FIRST end-to-end feature the agents should build (the 'first domain CRUD')?"
header: "Primary domain"
multiSelect: false
options:
  - "Custom — describe in notes" / "User specifies the entity name + 1 sentence about it"
```

Persist:
```json
{ "category": "...", "primary_domain": "...", "primary_domain_description": "..." }
```

## Round 3 — Sensitive data class

```
question: "What sensitivity tier applies to user data?"
header: "Data class"
multiSelect: false
options:
  - "Health data (GDPR special category)" / "Encryption mandatory, consent for health_data_processing, ISO 27001 + ISO 27799 alignment, retention 60-120 months"
  - "Personal data only" / "Encryption recommended, consent for terms+privacy, GDPR Art. 6 lawful bases, retention 24-60 months"
  - "Public-only / no PII" / "Anonymous data only, no encryption layer needed (skill will warn this is rare)"
```

Persist:
```json
{ "data_class": "..." }
```

This decides whether `apps/server` ships with the full GDPR layer (default) or a stripped variant. **Default to "Health data" if user is unsure** — over-protecting is reversible, under-protecting is a breach.

## Round 4 — Surfaces

```
question: "Which surfaces should be scaffolded?"
header: "Surfaces"
multiSelect: true
options:
  - "Marketing site (Next.js 16)" / "Public-facing landing, blog, SEO. Recommended for any consumer product. (dir: apps/website)"
  - "User dashboard (Vite + React + TanStack)" / "Authenticated app. Required — always kept."
  - "Mobile companion (Expo + React Native)" / "iOS/Android app reusing @repo/server-sdk types"
```

> A second Professional/Admin platform (separate Fastify + Vite app) is a **post-bootstrap extension**, not a starter surface — the scaffold ships one server + one dashboard. Add it later by duplicating the pattern; don't offer it here.

Persist (surface keys map to dirs: `marketing` → `apps/website`, `mobile` → `apps/mobile`; `dashboard` + `server` are always kept):
```json
{ "surfaces": ["marketing", "dashboard", "mobile"] }
```

## Round 5 — Tone + brand

```
question: "Pick the closest design tone — agents will refine via impeccable later."
header: "Tone"
multiSelect: false
options:
  - "Clinical / calm / precise" / "Steel-blue, generous whitespace, no decoration. Apple Health / Calm references. Default for healthcare."
  - "Warm / human / approachable" / "Soft warm hues, rounded corners, gentle illustration. Doctolib / Headspace references."
  - "Sharp / professional / dense" / "High contrast, dense data, geometric. Linear / Stripe references. Default for B2B."
  - "Custom — describe in notes" / "User specifies brand keywords + reference apps in notes"
```

Then:
```
question: "Primary brand hue? (will be applied via OKLCh tokens in design/tokens.md)"
header: "Hue"
multiSelect: false
options:
  - "Steel blue (~245)" / "Trust, clinical precision. Default."
  - "Teal / cyan (~200-220)" / "Wellness, balance, fresh."
  - "Forest / sage (~140)" / "Natural, calm, growth."
  - "Custom — describe in notes" / "User provides hex, HSL, or OKLCh values, or a brand name to anchor on"
```

Persist:
```json
{ "tone": "...", "tone_keywords": "...", "primary_hue": 245, "secondary_hue": null }
```

## Round 6 — Legal identity (optional)

These flow into the marketing site's SEO/site-config, the legal pages, and the
transactional email templates. Skippable — `personalize.sh` falls back to
sensible non-generic defaults (`company_name` = project name, `contact_email`
= `hello@<project>.com`, `tagline` = the one-liner, address fields blank).

```
question: "Legal/company identity for legal pages, email, and SEO? (optional — skip to use defaults)"
header: "Identity"
multiSelect: false
options:
  - "Provide now (write in notes)" / "User gives legal company name, contact email, and optionally a registered address"
  - "Use defaults / fill later" / "Defaults derived from the project name; refine in design + legal pages later"
```

Persist (any subset; omit keys to accept the default):
```json
{ "company_name": "...", "contact_email": "...", "tagline": "...", "street_address": "...", "postal_code": "...", "address_city": "...", "address_region": "..." }
```

## Confirmation step

Before running `bootstrap.sh`, **echo back a one-paragraph summary** of every decision and ask the user:

> "Confirm to bootstrap, or which round to revisit?"

Only proceed on explicit "yes" / "confirm" / "go". Never assume silence is approval.

## Persistence format

Final `.claude/bootstrap-answers.json`:

```json
{
  "version": 1,
  "answeredAt": "ISO timestamp",
  "project_name": "string",
  "one_liner": "string",
  "category": "healthcare_patient | healthcare_pro | consumer_wellness | b2b_saas",
  "primary_domain": "string (PascalCase entity name)",
  "primary_domain_description": "string",
  "data_class": "health | personal | public",
  "surfaces": ["marketing", "dashboard", "mobile"],
  "tone": "clinical | warm | sharp | custom",
  "tone_keywords": "string",
  "primary_hue": 245,
  "secondary_hue": null,

  "company_name": "string (optional — defaults to project_name)",
  "contact_email": "string (optional — defaults to hello@<project>.com)",
  "tagline": "string (optional — defaults to one_liner)",
  "street_address": "string (optional)",
  "postal_code": "string (optional)",
  "address_city": "string (optional)",
  "address_region": "string (optional)"
}
```

> `personalize.sh` fills any remaining design tokens (`MISSION`, `FONT_SANS`,
> persona/copy/reference tokens, `PRO_HUE`, …) from the tone + category answers,
> so no `{{...}}` survives. The design-system agent refines them afterward.

Spawned agents read this file. Never re-ask the user for facts already in it; if you need a new fact, add a field, document it here, and ask only for the new one.
