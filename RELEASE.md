# Release Process

This document describes how to create a new release of gh-magic-matrix.

## How It Works (Following snk's Pattern)

### CI Workflow (Continuous Integration)
On every push to main and pull requests:
1. **Lint and test** - Type check, lint, run tests
2. **Test local action** - Build Docker locally, generate SVGs, publish to `output` branch
3. **No Docker Hub push** - Docker is only built locally for testing

### Release Workflow (Manual)
Triggered manually when you want to publish a new version:
1. **Build and push Docker** - Build image and push to Docker Hub
2. **Update action.yml** - Pin to exact image digest (security best practice)
3. **Version tagging** - Create git tags:
   - `v1.2.3` - Exact version
   - `v1.2` - Minor version (auto-updated)
   - `v1` - Major version (auto-updated)
4. **Create GitHub Release** - With release notes

## How to Release

### Prerequisites
1. Make sure you have Docker Hub secrets configured:
   - `DCKR_USR` - Your Docker Hub username
   - `DCKR_PAT` - Your Docker Hub Personal Access Token

### Steps

1. **Go to Actions → Release**
2. **Click "Run workflow"**
3. **Enter version** (e.g., `1.0.0`, `1.1.0`, `2.0.0-beta.1`)
4. **Enter description** (optional - auto-generates from commits if empty)
5. **Click "Run workflow"**

### Version Format

- **Stable releases**: `1.0.0`, `1.1.0`, `2.0.0`
  - Creates tags: `v1.0.0`, `v1.0`, `v1`
  - Users can use `diverger/gh-magic-matrix@v1` for latest stable

- **Pre-releases**: `1.0.0-beta.1`, `2.0.0-rc.1`
  - Creates tag: `v1.0.0-beta.1` only
  - Marked as pre-release on GitHub

## User Reference Patterns

After releasing `v1.2.3`, users can reference your action as:

```yaml
# Pin to exact version (most stable)
- uses: diverger/gh-magic-matrix@v1.2.3

# Auto-update to latest patch (recommended)
- uses: diverger/gh-magic-matrix@v1.2

# Auto-update to latest minor (flexible)
- uses: diverger/gh-magic-matrix@v1

# Always use latest (not recommended)
- uses: diverger/gh-magic-matrix@main
```

## What Gets Updated

When you release:
- ✅ Docker image pushed to Docker Hub
- ✅ `action.yml` updated with new image digest
- ✅ `package.json` version bumped
- ✅ Git tags created
- ✅ GitHub Release created with notes

## First Release Checklist

Before your first release:
- [ ] Set up Docker Hub secrets (`DCKR_USR`, `DCKR_PAT`)
- [ ] Verify CI passes on main
- [ ] Check that `output` branch has examples
- [ ] Update README.md with final documentation
- [ ] Run release workflow with version `1.0.0`

## Comparison with snk

Our release process is based on [snk's proven pattern](https://github.com/Platane/snk):
- ✅ Same Docker digest pinning
- ✅ Same major/minor tag auto-updating
- ✅ Same CI vs Release separation
- ✅ Same `sed` trick for local vs published Docker image
