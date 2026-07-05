#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/set-aman.sh <aman_github_username>
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 AMAN_GITHUB_USERNAME"
  exit 1
fi
AMAN_USER="$1"

# Switch this repository to use Aman's identity
git config user.name "Aman Singh"
git config user.email "amansingh60304@gmail.com"

# Point push URL to Aman's fork via the github-aman host alias
git remote set-url --push origin "git@github-aman:${AMAN_USER}/NitroBerry-MonoRepo.git" 2>/dev/null || true

echo "Local git identity set to Aman Singh <amansingh60304@gmail.com>"
echo "Push URL set to git@github-aman:${AMAN_USER}/NitroBerry-MonoRepo.git (push only)"
