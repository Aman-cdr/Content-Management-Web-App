#!/usr/bin/env bash
set -euo pipefail

# Switch this repository to use Piyush's identity and push remote
git config user.name "Piyush Sharma"
git config user.email "ps72978255@gmail.com"

# Set push URL to Piyush's SSH remote (keeps fetch URL intact)
git remote set-url --push origin git@github.com:piyush7297/NitroBerry-MonoRepo.git 2>/dev/null || true

echo "Local git identity set to Piyush Sharma <ps72978255@gmail.com>"
echo "Push URL set to git@github.com:piyush7297/NitroBerry-MonoRepo.git (push only)"
