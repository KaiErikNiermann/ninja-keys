set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# List recipes
default:
    @just --list

# --- Development setup ---

# Install dependencies for the library and the docs site (frozen lockfile)
install:
    pnpm install --frozen-lockfile

# Build, serve the dev page on web-dev-server, and rebuild on change
dev: install
    pnpm start

# --- Library ---

# Compile the library to dist/
build:
    pnpm run build

# Build the minified single-file bundle (dist/ninja-keys.bundled.js)
bundle:
    pnpm run bundle

# Regenerate custom-elements.json from the source
analyze:
    pnpm run analyze

# Lint: lit-analyzer, ESLint, the scripts' type-check and the version check
lint:
    pnpm run lint

# Fix what ESLint can fix
lint-fix:
    pnpm exec eslint . --fix

# Run the tests (they run against dist/, so this builds first)
test: build
    pnpm test

# Run the tests in watch mode
test-watch: build
    pnpm run test:watch

# Check formatting
fmt-check:
    pnpm run format:check

# Format everything
fmt:
    pnpm run format

# Minified gzip size of the bundle
size:
    pnpm run checksize

# Run all library checks
check-lib: build lint test

# --- Docs ---

# Serve the docs site with live reload (builds the library first)
docs: install
    pnpm run docs

# Type-check, lint and build the docs site
check-docs:
    pnpm --dir docs run check
    pnpm --dir docs run lint
    pnpm --dir docs run build

# Build the docs site as GitHub Pages serves it (under /ninja-keys)
docs-build-pages:
    BASE_PATH=/ninja-keys pnpm --dir docs run build

# Preview the built docs site
docs-preview:
    pnpm --dir docs run preview

# --- Combined ---

# Run every check the pre-push hook runs
check: check-lib check-docs

# Remove build output
clean:
    pnpm run clean
    rm -rf docs/build docs/.svelte-kit

# --- Versioning ---
#
# The version lives in package.json and in every pinned
# `@appulsauce/ninja-keys@X.Y.Z` (the esm.sh URLs in README.md and on the
# installation page). scripts/version.ts finds them all, so these recipes
# rewrite every one at once. Each rewrite is recorded in the git directory;
# `version-undo` steps back through them. Add `--dry-run` to preview.

# Show the version and every place it is written
version:
    @node scripts/version.ts show

# Fail unless every mention matches package.json
version-check:
    @node scripts/version.ts check

# Bump every mention: major | minor | patch | premajor | preminor | prepatch | prerelease
bump kind="patch" *flags:
    @node scripts/version.ts bump {{ kind }} {{ flags }}

# Set every mention to an exact version (manual mode), e.g. 2.0.0 or 2.0.0-rc.1
set-version version *flags:
    @node scripts/version.ts set {{ version }} {{ flags }}

# Undo the last bump/set-version (repeat to go further back)
version-undo *flags:
    @node scripts/version.ts undo {{ flags }}

# --- Release ---

# Bump, run every check, commit, tag and push. Publishing stays a separate step.
release kind="patch":
    #!/usr/bin/env bash
    set -euo pipefail
    just _clean-tree
    node scripts/version.ts bump {{ kind }}
    just _release

# Release an exact version (same steps as `release`)
release-version version:
    #!/usr/bin/env bash
    set -euo pipefail
    just _clean-tree
    node scripts/version.ts set {{ version }}
    just _release

# Create the GitHub release for the current tag; notes from a file, else a draft
gh-release notes="":
    #!/usr/bin/env bash
    set -euo pipefail
    tag="v$(node -p "require('./package.json').version")"
    if [ -n "{{ notes }}" ]; then
      gh release create "$tag" --title "$tag" --notes-file "{{ notes }}"
    else
      gh release create "$tag" --title "$tag" --notes "" --draft
      echo "Created $tag as a draft: write its notes on GitHub, then publish it."
    fi

# Internal: commit the version rewrite, tag it and push both. On a failed
# check the rewrite is left in place: fix and re-run `just _release`, or
# `just version-undo` to drop it.
_release:
    #!/usr/bin/env bash
    set -euo pipefail
    version=$(node -p "require('./package.json').version")
    just check
    # _clean-tree ran first, so the version rewrite is the only tracked change.
    git add -u
    git commit -m "chore(release): v$version"
    git tag "v$version"
    git push
    git push origin "v$version"
    echo "Tagged and pushed v$version. Next: just publish-dry, just publish, just gh-release"

# Internal: refuse to release from a tree with uncommitted changes
_clean-tree:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
      echo "error: commit or stash your changes first; a release commit holds only the version." >&2
      exit 1
    fi

# --- Publishing ---

# Show what would be published (builds via prepublishOnly; uploads nothing)
publish-dry:
    pnpm publish --dry-run --no-git-checks

# Publish @appulsauce/ninja-keys to npm (asks for your 2FA code if enabled)
publish:
    #!/usr/bin/env bash
    set -euo pipefail
    just version-check
    version=$(node -p "require('./package.json').version")
    if ! git rev-parse -q --verify "refs/tags/v$version" >/dev/null; then
      echo "error: no tag v$version; run just release first" >&2
      exit 1
    fi
    if [[ "$version" == *-* ]]; then
      pnpm publish --tag next
    else
      pnpm publish
    fi
