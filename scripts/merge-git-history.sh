#!/usr/bin/env bash
# merge-git-history.sh
# One-time script to merge git histories from both original repos into the monorepo.
# Run this ONCE from the workspace root after initialising the monorepo git repo.
# Replace <org> with your actual GitHub username or organisation name.
set -euo pipefail

echo "Step 1: Merging big-bull-ui history into apps/ui ..."
git remote add ui https://github.com/shawshank3/big-bull-ui.git
git fetch ui
git subtree add --prefix=apps/ui ui main

echo "Step 2: Merging big-bull-api history into apps/api ..."
git remote add api https://github.com/shawshank3/big-bull-api.git
git fetch api
git subtree add --prefix=apps/api api main

echo "Step 3: Removing temporary remotes ..."
git remote remove ui
git remote remove api

echo "Done. Run 'git log --oneline' to verify both histories are reachable."
