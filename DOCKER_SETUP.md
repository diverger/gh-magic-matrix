# Docker Hub Setup for gh-magic-matrix

## Quick Start

### 1. Create Docker Hub Account
- Go to https://hub.docker.com/signup
- Create a free account

### 2. Create Access Token
- Log in to Docker Hub
- Go to Account Settings → Security → Access Tokens
- Click "New Access Token"
- Name it: `github-actions-gh-magic-matrix`
- Copy the token (you won't see it again!)

### 3. Add Secrets to GitHub
- Go to your GitHub repo → Settings → Secrets and variables → Actions
- Click "New repository secret"
- Add two secrets:
  - **Name**: `DOCKERHUB_USERNAME`
    - **Value**: Your Docker Hub username
  - **Name**: `DOCKERHUB_TOKEN`
    - **Value**: The access token you just created

### 4. Trigger Build
The Docker image will be automatically built and pushed when:
- You push to `main` branch
- Or manually trigger via Actions → "Build and Push Docker Image" → "Run workflow"

### 5. Verify
- Check Docker Hub: https://hub.docker.com/r/YOUR_USERNAME/gh-magic-matrix
- Your image will be public and ready to use!

## How It Works

1. **Automatic builds**: Every push to `main` triggers a build
2. **Fast caching**: Uses Docker layer caching for quick rebuilds
3. **Auto-update**: `action.yml` is automatically updated with new image digest
4. **Two tags**:
   - `latest` - always points to newest build
   - `<commit-sha>` - specific version for each commit

## Usage

Once published, users can reference your action:

```yaml
- uses: YOUR_USERNAME/gh-magic-matrix@main
  with:
    github_user_name: ${{ github.repository_owner }}
```

The action will use the pre-built Docker image from Docker Hub instead of building from Dockerfile (much faster!).

## Image URL

Your public Docker image will be available at:
- `docker.io/YOUR_USERNAME/gh-magic-matrix:latest`
- Or: `YOUR_USERNAME/gh-magic-matrix:latest`
