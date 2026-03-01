#!/bin/bash
# setup-gh-environments.sh
#
# One-time script to push .env.* secrets to GitHub Environments.
# Run ONCE after cloning or rotating secrets.
#
# Requirements: gh CLI authenticated (gh auth login)
# Usage: bash scripts/setup-gh-environments.sh

set -e

REPO="juanobrach/entity-builders"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔧 Setting up GitHub Environments for Potlink..."
echo ""

# ─── Helpers ─────────────────────────────────────────────────────────────────

push_env_secrets() {
  local environment="$1"
  local env_file="$2"

  if [ ! -f "$env_file" ]; then
    echo "  ⚠️  $env_file not found — skipping $environment"
    return
  fi

  echo "  📤 Pushing secrets to '$environment' from $(basename $env_file)..."

  while IFS= read -r line; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue

    key="${line%%=*}"
    value="${line#*=}"

    # Skip empty values
    [ -z "$value" ] && continue

    gh secret set "$key" \
      --env "$environment" \
      --repo "$REPO" \
      --body "$value"

    echo "    ✅ $key"
  done < "$env_file"

  echo ""
}

# ─── potlink-development ─────────────────────────────────────────────────────
# Note: .env.development is committed — this only needs to run if you want
# secrets in the GitHub Environment for reference / extra security.
push_env_secrets "potlink-development" "$APP_DIR/.env.development"

# ─── potlink-production ──────────────────────────────────────────────────────
# .env.production is gitignored. Copy .env.production.template, fill in values,
# then run this script.
push_env_secrets "potlink-production" "$APP_DIR/.env.production"

echo "✅ Done! Verify at:"
echo "   https://github.com/$REPO/settings/environments"
