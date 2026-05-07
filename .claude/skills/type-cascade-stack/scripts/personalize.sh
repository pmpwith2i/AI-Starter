#!/usr/bin/env bash
# personalize.sh — finalize a freshly cloned `metaimed-starter`.
#
# Pre-conditions:
#   - cwd is the root of the cloned starter
#   - .claude/bootstrap-answers.json exists (written by SKILL.md interview step)
#
# Steps:
#   1. Substitute placeholders in AGENT.md, CLAUDE.md, README.md, design/*.md, package.json files
#   2. Generate ENCRYPTION_KEY + JWT_SECRET_KEY into apps/server/.env (and other apps' .env if present)
#   3. Drop apps/<surface>/ for surfaces the user did NOT pick
#   4. pnpm install
#   5. docker compose up -d
#   6. Prisma migrate dev + apply triggers + permissions

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

PROJECT_NAME=$(read_answer project_name "Starter")
COMPANY_NAME=$(read_answer company_name "$PROJECT_NAME Inc.")
ONE_LINER=$(read_answer one_liner "TODO: project pitch")
TAGLINE=$(read_answer tagline "$ONE_LINER")
CATEGORY=$(read_answer category "consumer_wellness")
PRIMARY_DOMAIN=$(read_answer primary_domain "Item")
PRIMARY_DOMAIN_DESCRIPTION=$(read_answer primary_domain_description "TODO")
DATA_CLASS=$(read_answer data_class "personal")
TONE=$(read_answer tone "clinical")
TONE_KEYWORDS=$(read_answer tone_keywords "calm, precise, restrained")
PRIMARY_HUE=$(read_answer primary_hue "245")
SECONDARY_HUE=$(read_answer secondary_hue "")
CONTACT_EMAIL=$(read_answer contact_email "hello@example.com")
STREET_ADDRESS=$(read_answer street_address "")
POSTAL_CODE=$(read_answer postal_code "")
ADDRESS_CITY=$(read_answer address_city "")
ADDRESS_REGION=$(read_answer address_region "")
SURFACES=$(jq -r '.surfaces // [] | join(",")' "$ANSWERS")
TODAY_ISO=$(date -u +"%Y-%m-%d")
PROJECT_KEBAB=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//; s/-$//')

echo ">> Project: $PROJECT_NAME"
echo ">> Domain:  $PRIMARY_DOMAIN ($CATEGORY)"
echo ">> Tone:    $TONE_KEYWORDS"
echo ">> Hue:     $PRIMARY_HUE"
echo ">> Surfaces: $SURFACES"

# ----- 1. Substitute placeholders in markdown files -----

substitute() {
  local file="$1"
  if [[ ! -f "$file" ]]; then return; fi
  # Skip files that don't contain any placeholder (faster + avoids touching
  # mtimes for nothing).
  if ! grep -q '{{' "$file" 2>/dev/null; then return; fi
  sed -i.bak \
    -e "s|{{PROJECT_NAME}}|${PROJECT_NAME}|g" \
    -e "s|{{COMPANY_NAME}}|${COMPANY_NAME}|g" \
    -e "s|{{ONE_LINER}}|${ONE_LINER}|g" \
    -e "s|{{TAGLINE}}|${TAGLINE}|g" \
    -e "s|{{CATEGORY}}|${CATEGORY}|g" \
    -e "s|{{PRIMARY_DOMAIN}}|${PRIMARY_DOMAIN}|g" \
    -e "s|{{PRIMARY_DOMAIN_DESCRIPTION}}|${PRIMARY_DOMAIN_DESCRIPTION}|g" \
    -e "s|{{DATA_CLASS}}|${DATA_CLASS}|g" \
    -e "s|{{TONE_KEYWORDS}}|${TONE_KEYWORDS}|g" \
    -e "s|{{PRIMARY_HUE}}|${PRIMARY_HUE}|g" \
    -e "s|{{SECONDARY_HUE}}|${SECONDARY_HUE}|g" \
    -e "s|{{PROJECT_KEBAB}}|${PROJECT_KEBAB}|g" \
    -e "s|{{AUDIENCE}}|${CATEGORY}|g" \
    -e "s|{{SURFACES}}|${SURFACES}|g" \
    -e "s|{{TODAY_ISO}}|${TODAY_ISO}|g" \
    -e "s|{{CONTACT_EMAIL}}|${CONTACT_EMAIL}|g" \
    -e "s|{{STREET_ADDRESS}}|${STREET_ADDRESS}|g" \
    -e "s|{{POSTAL_CODE}}|${POSTAL_CODE}|g" \
    -e "s|{{ADDRESS_CITY}}|${ADDRESS_CITY}|g" \
    -e "s|{{ADDRESS_REGION}}|${ADDRESS_REGION}|g" \
    "$file"
  rm -f "${file}.bak"
}

echo ">> Substituting placeholders in docs + design"
for f in AGENT.md CLAUDE.md README.md design/tone.md design/brand.md design/tokens.md design/components.md; do
  substitute "$f"
done

echo ">> Substituting placeholders across the source tree"
# In-source placeholders (auth-layout, consent-form, email templates, legal,
# website pages, marketing content, mobile screens). Limited to the file
# extensions where we placed `{{...}}` tokens, never matches node_modules.
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
  done < <(find "$root" -type f \( -name '*.ts' -o -name '*.tsx' \))
done

# Update root package.json name field
if [[ -f package.json ]] && command -v jq >/dev/null 2>&1; then
  tmp=$(mktemp)
  jq --arg n "$PROJECT_KEBAB" '.name = $n' package.json > "$tmp" && mv "$tmp" package.json
fi

# ----- 2. Generate secrets into apps/server/.env -----

if [[ ! -f apps/server/.env ]]; then
  cp apps/server/.env.example apps/server/.env
  if command -v openssl >/dev/null 2>&1; then
    KEY=$(openssl rand -hex 32)
    JWT=$(openssl rand -hex 32)
    sed -i.bak "s|^ENCRYPTION_KEY=.*$|ENCRYPTION_KEY=${KEY}|" apps/server/.env
    sed -i.bak "s|^JWT_SECRET_KEY=.*$|JWT_SECRET_KEY=${JWT}|" apps/server/.env
    rm -f apps/server/.env.bak
    echo ">> apps/server/.env populated (ENCRYPTION_KEY + JWT_SECRET_KEY generated)"
  fi
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

# ----- 4. pnpm install -----

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

# ----- 6. Prisma migrate + triggers + permissions -----

if command -v pnpm >/dev/null 2>&1; then
  sleep 3 # let Postgres warm up
  echo ">> Prisma migrate dev"
  pnpm --filter @repo/db exec prisma migrate dev --name init --skip-seed || echo "!! migrate failed; verify DATABASE_URL"
  pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/triggers.sql || true
  pnpm --filter @repo/db exec prisma db execute --file prisma/raw_sql/permissions.sql || true
  pnpm --filter @repo/db exec prisma db seed || true
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
