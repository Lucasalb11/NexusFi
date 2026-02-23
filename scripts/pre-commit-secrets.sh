#!/usr/bin/env bash
# =====================================================================
# NexusFi — Pre-commit Secret Scanner
#
# Scans staged files for potential secrets, API keys, and credentials.
# Blocks the commit if any are found. Install via:
#   cp scripts/pre-commit-secrets.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or run: pnpm run setup:hooks
# =====================================================================

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

PATTERNS=(
  # Generic secret patterns (assignment with actual values)
  'PRIVATE[_-]?KEY\s*[:=]\s*["\x27][A-Za-z0-9]'
  'SECRET[_-]?KEY\s*[:=]\s*["\x27][A-Za-z0-9]'
  'API[_-]?SECRET\s*[:=]\s*["\x27][A-Za-z0-9]'
  'ACCESS[_-]?TOKEN\s*[:=]\s*["\x27][A-Za-z0-9]'
  'AUTH[_-]?TOKEN\s*[:=]\s*["\x27][A-Za-z0-9]'
  'PASSWORD\s*[:=]\s*["\x27][^\s]'
  # Stellar secret keys only (start with S, not G which are public)
  '\bS[A-Z2-7]{55}\b'
  # Chainlink / CRE
  'OPERATOR[_-]?SECRET\s*[:=]\s*["\x27][A-Za-z0-9]'
  # AWS
  'AKIA[0-9A-Z]{16}'
  # MoonPay secret keys
  'sk_(test|live)_[A-Za-z0-9]{20,}'
)

ALLOW_PATTERNS=(
  '\.env\.example'
  '\.md$'
  'pre-commit-secrets\.sh'
  'validate-env\.ts'
  'gitleaks\.toml'
  'pnpm-lock\.yaml'
  'package-lock\.json'
  'bun\.lock'
  'mock-data\.ts'
)

echo -e "${GREEN}[NexusFi]${NC} Scanning staged files for secrets..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

FOUND_SECRETS=0

for file in $STAGED_FILES; do
  # Skip binary files
  if file "$file" 2>/dev/null | grep -q "binary"; then
    continue
  fi

  # Skip allowed files
  SKIP=0
  for allow in "${ALLOW_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$allow"; then
      SKIP=1
      break
    fi
  done
  [ "$SKIP" -eq 1 ] && continue

  CONTENT=$(git show ":$file" 2>/dev/null || true)
  [ -z "$CONTENT" ] && continue

  for pattern in "${PATTERNS[@]}"; do
    MATCHES=$(echo "$CONTENT" | grep -nEi "$pattern" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
      echo ""
      echo -e "${RED}[BLOCKED]${NC} Potential secret in ${YELLOW}${file}${NC}:"
      echo "$MATCHES" | head -5
      FOUND_SECRETS=1
    fi
  done
done

if [ "$FOUND_SECRETS" -ne 0 ]; then
  echo ""
  echo -e "${RED}=============================================${NC}"
  echo -e "${RED}  COMMIT BLOCKED — Potential secrets found!  ${NC}"
  echo -e "${RED}=============================================${NC}"
  echo ""
  echo "  Move secrets to .env (gitignored) and reference via process.env."
  echo "  If this is a false positive, use: git commit --no-verify"
  echo ""
  exit 1
fi

echo -e "${GREEN}[NexusFi]${NC} No secrets detected. Proceeding with commit."
exit 0
