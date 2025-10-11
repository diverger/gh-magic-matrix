# GitHub Workflows Summary

## Workflow Files

### 1. **ci.yml** - Continuous Integration
**Trigger**: Push to main, Pull requests

**Jobs:**
- `lint-and-test`: Run type checking, linting, and tests
- `test-local-action`: Build and test the action locally with Dockerfile

**Purpose**: Ensure code quality before merging

---

### 2. **docker-build.yml** - Docker Image Publishing
**Trigger**:
- Push to main (only when code/Docker files change)
- Manual trigger

**Purpose**: Build and publish Docker image to Docker Hub
- Tags: `latest` and `<commit-sha>`
- Auto-updates `action.yml` with new image digest
- Uses `[skip ci]` to prevent infinite loops

---

### 3. **generate.yml** - Example Generation
**Trigger**:
- Daily at midnight (cron)
- Manual trigger

**Purpose**: Generate example breathing contribution SVGs with different themes

**What it does:**
1. ✅ Generates 3 example SVGs:
   - Default GitHub colors
   - Dark theme
   - Ocean theme
2. ✅ Publishes to `output` branch (not main)
3. ✅ Users can view live examples
4. ✅ No commits to main branch

**View examples**: Check the `output` branch

---

### 4. **test.yml** - Published Action Testing
**Trigger**: Manual only

**Jobs:**
- `test-published`: Test the published action from main branch
- `test-with-custom-colors`: Test with custom color configurations

**Purpose**: Validate that published action works correctly

---

### 5. **release.yml** - Version Release
**Trigger**: Manual (with version input)

**Purpose**: Create official versioned releases
- Publishes to Docker Hub and ghcr.io
- Creates Git tags
- Creates GitHub releases
- Updates version in package.json

---

## Workflow Comparison

| Workflow | snk name | gh-magic-matrix name | Purpose |
|----------|----------|-------------------|---------|
| CI/Testing | main.yml | **ci.yml** | Run tests and validate code |
| Docker Build | (in release) | **docker-build.yml** | Auto-publish Docker images |
| Example/Demo | main.yml (deploy-ghpages) | **generate.yml** | Generate examples |
| Manual Test | manual-run.yml | **test.yml** | Test published action |
| Release | release.yml | **release.yml** | Version releases |

---

## Key Differences from snk

✅ **Different names** to avoid confusion
✅ **Path filters** on docker-build to avoid unnecessary builds
✅ **`[skip ci]`** tags to prevent infinite loops
✅ **Separated concerns**: Docker build is separate from CI
✅ **Validation workflow** for testing published versions

---

## Workflow Triggers Summary

```
Push to main → ci.yml + docker-build.yml (if code changed)
Pull Request → ci.yml
Daily cron → generate.yml (publishes to examples branch)
Manual → test.yml, docker-build.yml, generate.yml, release.yml
```

---

## Prevention of Infinite Loops

1. **docker-build.yml**:
   - Only triggers on code/Docker file changes
   - Uses `[skip ci]` in commit message

2. **generate.yml**:
   - Publishes to `examples` branch (not main)
   - No commits to main = no loops

3. **ci.yml**:
   - Only runs tests, doesn't commit anything
