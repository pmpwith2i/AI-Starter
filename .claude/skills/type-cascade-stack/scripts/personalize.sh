#!/usr/bin/env bash
# personalize.sh — finalize a freshly cloned `metaimed-starter`.
#
# Pre-conditions:
#   - cwd is the root of the cloned starter
#   - .claude/bootstrap-answers.json exists (written by SKILL.md interview step)
#
# Steps:
#   1. Substitute EVERY {{...}} placeholder in docs, design, source, package.json,
#      app.json — using interview answers, falling back to tone/category-derived
#      defaults so no raw placeholder survives.
#   2. Generate ENCRYPTION_KEY + JWT_SECRET_KEY into apps/server/.env, and create
#      packages/db/.env (Prisma reads DATABASE_URL from the db package cwd).
#   3. Set the mobile app identity (name, slug, scheme, bundle id) in app.json.
#   4. Drop apps/<surface>/ for surfaces the user did NOT pick.
#   5. pnpm install (postinstall runs `prisma generate`).
#   6. docker compose up -d + Prisma migrate + triggers + permissions + seed.
#   7. Warn about any leftover {{...}} placeholders.

set -euo pipefail

ANSWERS=".claude/bootstrap-answers.json"

if [[ ! -f "$ANSWERS" ]]; then
  echo "ERROR: $ANSWERS not found. Run the interview step first." >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required (brew install jq)." >&2
  exit 1
fi

read_answer() {
  local key="$1"
  local default="${2:-}"
  local v
  v=$(jq -r --arg k "$key" '.[$k] // empty' "$ANSWERS")
  if [[ -z "$v" || "$v" == "null" ]]; then
    echo "$default"
  else
    echo "$v"
  fi
}

# ----- Core answers -----
PROJECT_NAME=$(read_answer project_name "Starter")
ONE_LINER=$(read_answer one_liner "TODO: project pitch")
CATEGORY=$(read_answer category "consumer_wellness")
PRIMARY_DOMAIN=$(read_answer primary_domain "Item")
PRIMARY_DOMAIN_DESCRIPTION=$(read_answer primary_domain_description "TODO: describe the first domain entity")
DATA_CLASS=$(read_answer data_class "personal")
TONE=$(read_answer tone "clinical")
TONE_KEYWORDS=$(read_answer tone_keywords "calm, precise, restrained")
PRIMARY_HUE=$(read_answer primary_hue "245")
SECONDARY_HUE=$(read_answer secondary_hue "")
SURFACES=$(jq -r '.surfaces // [] | join(",")' "$ANSWERS")
TODAY_ISO=$(date -u +"%Y-%m-%d")

PROJECT_KEBAB=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//; s/-$//')
[[ -z "$PROJECT_KEBAB" ]] && PROJECT_KEBAB="starter"
PROJECT_SLUG_NODASH=$(echo "$PROJECT_KEBAB" | tr -d '-')
[[ -z "$PROJECT_SLUG_NODASH" ]] && PROJECT_SLUG_NODASH="app"

# ----- Legal identity (optional — sensible non-generic fallbacks) -----
COMPANY_NAME=$(read_answer company_name "$PROJECT_NAME")
CONTACT_EMAIL=$(read_answer contact_email "hello@${PROJECT_KEBAB}.com")
TAGLINE=$(read_answer tagline "$ONE_LINER")
STREET_ADDRESS=$(read_answer street_address "")
POSTAL_CODE=$(read_answer postal_code "")
ADDRESS_CITY=$(read_answer address_city "")
ADDRESS_REGION=$(read_answer address_region "")

# ----- Mobile identity (derived) -----
MOBILE_SCHEME=$(read_answer mobile_scheme "$PROJECT_SLUG_NODASH")
MOBILE_BUNDLE_ID=$(read_answer mobile_bundle_id "com.${PROJECT_SLUG_NODASH}.app")

# ----- Brand defaults -----
FONT_SANS=$(read_answer font_sans "Geist")
FONT_MONO=$(read_answer font_mono "Geist Mono")
ICON_LIBRARY=$(read_answer icon_library "Lucide React")
MISSION=$(read_answer mission "$ONE_LINER")
TAGLINE_CANDIDATES=$(read_answer tagline_candidates "- ${TAGLINE}")
COPY_VOCAB=$(read_answer copy_vocab "Plain language first; define any domain term on first use")
COPY_ERRORS=$(read_answer copy_errors "Always actionable, never blameful")

# Pro hue = primary - 25 deg (numeric); fall back to 220 if hue is non-numeric.
if [[ "$PRIMARY_HUE" =~ ^[0-9]+$ ]]; then
  PRO_HUE=$(( (PRIMARY_HUE + 360 - 25) % 360 ))
else
  PRO_HUE="220"
fi

# ----- Tone-derived design defaults -----
case "$TONE" in
  warm)
    PRIMARY_REASON=$(read_answer primary_reason "Warm hues lower anxiety and read as human, not clinical.")
    TONE_ONE_LINER=$(read_answer tone_one_liner "Approachable and human — a calm guide, never a cold portal.")
    PERSONA_PRIMARY=$(read_answer persona_primary "The warm, reassuring guide")
    PERSONA_ANTI=$(read_answer persona_anti "Cold portal; aggressive growth-hacker")
    COPY_FORMALITY=$(read_answer copy_formality "Friendly and direct; second person, contractions welcome")
    REFERENCE_POSITIVE=$(read_answer reference_positive "Doctolib, Headspace")
    REFERENCE_NEGATIVE=$(read_answer reference_negative "Enterprise admin consoles, legacy portals")
    ;;
  sharp)
    PRIMARY_REASON=$(read_answer primary_reason "High-contrast geometry signals precision and speed.")
    TONE_ONE_LINER=$(read_answer tone_one_liner "Sharp and professional — dense, fast, unambiguous.")
    PERSONA_PRIMARY=$(read_answer persona_primary "The expert power user")
    PERSONA_ANTI=$(read_answer persona_anti "Cartoon mascot; hand-holding consumer app")
    COPY_FORMALITY=$(read_answer copy_formality "Concise and neutral; lead with the noun, skip filler")
    REFERENCE_POSITIVE=$(read_answer reference_positive "Linear, Stripe")
    REFERENCE_NEGATIVE=$(read_answer reference_negative "Playful consumer apps, decorative marketing sites")
    ;;
  *)
    PRIMARY_REASON=$(read_answer primary_reason "Steel blue conveys clinical trust without sterility.")
    TONE_ONE_LINER=$(read_answer tone_one_liner "A well-organized professional tool — authoritative yet approachable.")
    PERSONA_PRIMARY=$(read_answer persona_primary "The trusted senior expert")
    PERSONA_ANTI=$(read_answer persona_anti "Cartoon mascot; aggressive growth-hacker; cold portal")
    COPY_FORMALITY=$(read_answer copy_formality "Precise and calm; pair any technical term with a plain-language gloss")
    REFERENCE_POSITIVE=$(read_answer reference_positive "Apple Health, Calm")
    REFERENCE_NEGATIVE=$(read_answer reference_negative "Gamified apps, cluttered dashboards")
    ;;
esac

# ----- Category-derived audience defaults -----
case "$CATEGORY" in
  healthcare_patient)
    AUDIENCE=$(read_answer audience "Patients managing chronic conditions, treatments, and wellness")
    AUDIENCE_EMOTION=$(read_answer audience_emotion "Anxious and seeking reassurance and control")
    AUDIENCE_NEED=$(read_answer audience_need "Clarity, calm, and confidence that nothing is missed")
    ;;
  healthcare_pro)
    AUDIENCE=$(read_answer audience "Clinicians and allied health professionals managing caseloads")
    AUDIENCE_EMOTION=$(read_answer audience_emotion "Time-pressed and detail-focused")
    AUDIENCE_NEED=$(read_answer audience_need "Speed, accuracy, and zero ambiguity")
    ;;
  b2b_saas)
    AUDIENCE=$(read_answer audience "Knowledge workers and internal operations teams")
    AUDIENCE_EMOTION=$(read_answer audience_emotion "Goal-oriented and efficiency-seeking")
    AUDIENCE_NEED=$(read_answer audience_need "Dense information, fast workflows, reliable data")
    ;;
  *)
    AUDIENCE=$(read_answer audience "$CATEGORY")
    AUDIENCE_EMOTION=$(read_answer audience_emotion "Curious and outcome-focused")
    AUDIENCE_NEED=$(read_answer audience_need "A clear path to the value the product promises")
    ;;
esac

echo ">> Project:  $PROJECT_NAME ($PROJECT_KEBAB)"
echo ">> Domain:   $PRIMARY_DOMAIN ($CATEGORY)"
echo ">> Tone:     $TONE — $TONE_KEYWORDS"
echo ">> Hue:      $PRIMARY_HUE (pro $PRO_HUE)"
echo ">> Surfaces: $SURFACES"
echo ">> Mobile:   $MOBILE_BUNDLE_ID"

# ----- 1. Substitute placeholders -----

substitute() {
  local file="$1"
  if [[ ! -f "$file" ]]; then return; fi
  if ! grep -q '{{' "$file" 2>/dev/null; then return; fi
  sed -i.bak \
    -e "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" \
    -e "s|{{PROJECT_KEBAB}}|${PROJECT_KEBAB}|g" \
    -e "s|{{COMPANY_NAME}}|${COMPANY_NAME}|g" \
    -e "s|{{ONE_LINER}}|${ONE_LINER}|g" \
    -e "s|{{TAGLINE}}|${TAGLINE}|g" \
    -e "s|{{TAGLINE_CANDIDATES}}|${TAGLINE_CANDIDATES}|g" \
    -e "s|{{MISSION}}|${MISSION}|g" \
    -e "s|{{CATEGORY}}|${CATEGORY}|g" \
    -e "s|{{PRIMARY_DOMAIN}}|${PRIMARY_DOMAIN}|g" \
    -e "s|{{PRIMARY_DOMAIN_DESCRIPTION}}|${PRIMARY_DOMAIN_DESCRIPTION}|g" \
    -e "s|{{DATA_CLASS}}|${DATA_CLASS}|g" \
    -e "s|{{AUDIENCE}}|${AUDIENCE}|g" \
    -e "s|{{AUDIENCE_EMOTION}}|${AUDIENCE_EMOTION}|g" \
    -e "s|{{AUDIENCE_NEED}}|${AUDIENCE_NEED}|g" \
    -e "s|{{TONE_KEYWORDS}}|${TONE_KEYWORDS}|g" \
    -e "s|{{TONE_ONE_LINER}}|${TONE_ONE_LINER}|g" \
    -e "s|{{PERSONA_PRIMARY}}|${PERSONA_PRIMARY}|g" \
    -e "s|{{PERSONA_ANTI}}|${PERSONA_ANTI}|g" \
    -e "s|{{COPY_FORMALITY}}|${COPY_FORMALITY}|g" \
    -e "s|{{COPY_VOCAB}}|${COPY_VOCAB}|g" \
    -e "s|{{COPY_ERRORS}}|${COPY_ERRORS}|g" \
    -e "s|{{REFERENCE_POSITIVE}}|${REFERENCE_POSITIVE}|g" \
    -e "s|{{REFERENCE_NEGATIVE}}|${REFERENCE_NEGATIVE}|g" \
    -e "s|{{PRIMARY_HUE}}|${PRIMARY_HUE}|g" \
    -e "s|{{SECONDARY_HUE}}|${SECONDARY_HUE}|g" \
    -e "s|{{PRO_HUE}}|${PRO_HUE}|g" \
    -e "s|{{PRIMARY_REASON}}|${PRIMARY_REASON}|g" \
    -e "s|{{FONT_SANS}}|${FONT_SANS}|g" \
    -e "s|{{FONT_MONO}}|${FONT_MONO}|g" \
    -e "s|{{ICON_LIBRARY}}|${ICON_LIBRARY}|g" \
    -e "s|{{SURFACES}}|${SURFACES}|g" \
    -e "s|{{TODAY_ISO}}|${TODAY_ISO}|g" \
    -e "s|{{CONTACT_EMAIL}}|${CONTACT_EMAIL}|g" \
    -e "s|{{STREET_ADDRESS}}|${STREET_ADDRESS}|g" \
    -e "s|{{POSTAL_CODE}}|${POSTAL_CODE}|g" \
    -e "s|{{ADDRESS_CITY}}|${ADDRESS_CITY}|g" \
    -e "s|{{ADDRESS_REGION}}|${ADDRESS_REGION}|g" \
    -e "s|{{MOBILE_SCHEME}}|${MOBILE_SCHEME}|g" \
    -e "s|{{MOBILE_BUNDLE_ID}}|${MOBILE_BUNDLE_ID}|g" \
    "$file"
  rm -f "${file}.bak"
}

echo ">> Substituting placeholders in docs + design"
for f in AGENT.md CLAUDE.md README.md design/tone.md design/brand.md design/tokens.md design/components.md; do
  substitute "$f"
done

echo ">> Substituting placeholders across the source tree"
SOURCE_GLOBS=(
  'apps/server/src'
  'apps/dashboard/src'
  'apps/website/src'
  'apps/mobile/app'
  'apps/mobile/components'
  'apps/mobile/lib'
  'packages/email/src'
  'packages/server-sdk/src'
)
for root in "${SOURCE_GLOBS[@]}"; do
  if [[ ! -d "$root" ]]; then continue; fi
  while IFS= read -r f; do
    substitute "$f"
  done < <(find "$root" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.po' \))
done

# Root package.json name
if [[ -f package.json ]]; then
  tmp=$(mktemp)
  jq --arg n "$PROJECT_KEBAB" '.name = $n' package.json > "$tmp" && mv "$tmp" package.json
fi

# Mobile app identity (app.json) — set even if {{...}} substitution already ran,
# so bundle id / scheme are always concrete and valid.
if [[ -f apps/mobile/app.json ]]; then
  tmp=$(mktemp)
  jq --arg name "$PROJECT_NAME" \
     --arg slug "${PROJECT_KEBAB}-mobile" \
     --arg scheme "$MOBILE_SCHEME" \
     --arg bundle "$MOBILE_BUNDLE_ID" \
     '.expo.name=$name | .expo.slug=$slug | .expo.scheme=$scheme | .expo.ios.bundleIdentifier=$bundle | .expo.android.package=$bundle' \
     apps/mobile/app.json > "$tmp" && mv "$tmp" apps/mobile/app.json
  echo ">> apps/mobile/app.json identity set ($MOBILE_BUNDLE_ID)"
fi

# ----- 2. Secrets + env files -----

if [[ ! -f apps/server/.env ]]; then
  cp apps/server/.env.example apps/server/.env
  if command -v openssl >/dev/null 2>&1; then
    KEY=$(openssl rand -hex 32)
    JWT=$(openssl rand -hex 32)
    sed -i.bak "s|^ENCRYPTION_KEY=.*$|ENCRYPTION_KEY=${KEY}|" apps/server/.env
    sed -i.bak "s|^JWT_SECRET_KEY=.*$|JWT_SECRET_KEY=${JWT}|" apps/server/.env
    rm -f apps/server/.env.bak
    echo ">> apps/server/.env populated (ENCRYPTION_KEY + JWT_SECRET_KEY generated)"
  else
    echo "!! openssl not found — set ENCRYPTION_KEY + JWT_SECRET_KEY in apps/server/.env manually" >&2
  fi
fi

# Prisma reads DATABASE_URL from packages/db/.env (its own cwd). Create it and
# keep it in sync with the server env.
if [[ ! -f packages/db/.env ]]; then
  if [[ -f packages/db/.env.example ]]; then
    cp packages/db/.env.example packages/db/.env
  else
    : > packages/db/.env
  fi
  DB_URL=$(grep -E '^DATABASE_URL=' apps/server/.env 2>/dev/null | head -1 | cut -d= -f2-)
  if [[ -n "${DB_URL:-}" ]]; then
    if grep -q '^DATABASE_URL=' packages/db/.env 2>/dev/null; then
      sed -i.bak "s|^DATABASE_URL=.*$|DATABASE_URL=${DB_URL}|" packages/db/.env
      rm -f packages/db/.env.bak
    else
      echo "DATABASE_URL=${DB_URL}" >> packages/db/.env
    fi
  fi
  echo ">> packages/db/.env created (DATABASE_URL in sync with apps/server/.env)"
fi

# ----- 3. Drop unwanted surfaces -----

drop_if_unselected() {
  local surface="$1"
  local dirname="$2"
  if [[ ",${SURFACES}," != *",${surface},"* ]] && [[ -d "apps/${dirname}" ]]; then
    echo ">> Removing apps/${dirname} (not selected in interview)"
    rm -rf "apps/${dirname}"
  fi
}

drop_if_unselected "marketing" "website"
drop_if_unselected "mobile" "mobile"

# ----- 4. pnpm install (postinstall generates the Prisma client) -----

if command -v pnpm >/dev/null 2>&1; then
  echo ">> pnpm install"
  pnpm install
else
  echo "!! pnpm not found — install with: npm install -g pnpm@9" >&2
fi

# ----- 5. docker compose -----

if command -v docker >/dev/null 2>&1; then
  echo ">> docker compose up -d"
  docker compose up -d || echo "!! docker compose failed; start it manually after fixing"
else
  echo "!! docker not found — start Postgres manually" >&2
fi

# ----- 6. Prisma migrate + triggers + permissions + seed -----

if command -v pnpm >/dev/null 2>&1; then
  sleep 3 # let Postgres warm up
  echo ">> Prisma migrate dev"
  pnpm --filter @repo/db exec prisma migrate dev --name init --skip-seed || echo "!! migrate failed; verify packages/db/.env DATABASE_URL + Postgres is up"
  pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql || true
  pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/permissions.sql || true
  pnpm --filter @repo/db exec prisma db seed || true
fi

# ----- 7. Leftover placeholder scan -----

echo ">> Scanning for unresolved {{...}} placeholders"
LEFTOVERS=$(grep -rlE '\{\{[A-Z_]+\}\}' \
  --include='*.md' --include='*.ts' --include='*.tsx' --include='*.json' --include='*.po' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=.next --exclude-dir=.turbo --exclude-dir=generated \
  AGENT.md CLAUDE.md README.md design apps packages 2>/dev/null || true)
if [[ -n "$LEFTOVERS" ]]; then
  echo "!! Some files still contain {{...}} placeholders — review and fill manually:"
  echo "$LEFTOVERS" | sed 's/^/     /'
else
  echo ">> No {{...}} placeholders remain."
fi

echo ""
echo "=== Personalization done. ==="
echo ""
echo "Next: spawn checkpoint agents (see .claude/skills/type-cascade-stack/AGENTS.md)."
echo "  1. design-system-agent"
echo "  2. auth-vertical-agent"
echo "  3. first-domain-agent (for ${PRIMARY_DOMAIN})"
echo "  4. deploy-infra-agent"
echo ""
echo "Pause for user review between each."
