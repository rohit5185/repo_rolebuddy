# CI/CD for RoleBuddy

This document describes the automated pipelines for the RoleBuddy monorepo (Next.js frontend, Express backend, MongoDB, Redis, Docker).

## Overview

| Workflow | File | When it runs | Purpose |
|----------|------|--------------|---------|
| **CI** | `.github/workflows/ci.yml` | Every PR and push to `main` | Lint, build, unit checks, API smokes, Docker build validation |
| **Publish Docker images** | `.github/workflows/docker-publish.yml` | Push to `main`, tags `v*.*.*` | Build and push images to GHCR |
| **Deploy staging** | `.github/workflows/deploy-staging.yml` | Manual only (`workflow_dispatch`) | SSH deploy to a staging server |

[Dependabot](https://docs.github.com/en/code-security/dependabot) (`.github/dependabot.yml`) opens weekly PRs for npm, Docker base images, and GitHub Actions updates.

## CI pipeline (required checks)

Recommended branch protection on `main`:

- Require status checks: **Frontend lint & build**, **Backend unit checks**, **API integration**, **Docker images build**
- Require pull request reviews before merge

### Jobs

1. **Frontend lint & build** — `npm ci`, `npm run lint`, `npm run build` (Node 20).
2. **Backend unit checks** — `npm run activity:smoke` (pure logic, no database).
3. **API integration** — MongoDB service container, starts the API, then:
   - `npm run ci:integration` → `auth:smoke` + `onboarding:smoke`
   - `npm run auth:check` (frontend client against live API)
4. **Docker images build** — `docker compose build` to ensure images still build.

### What CI intentionally does *not* run (yet)

Some scripts are flaky or depend on production Atlas data. Run them locally before release:

- `unified:smoke`, `discovery:smoke`, `matching:smoke`, `connection:smoke` (see [TESTING.md](../TESTING.md))

Add them to `ci:integration` after failures are fixed.

### Run the same checks locally

```bash
# Frontend
cd frontend
npm ci && npm run lint && npm run build

# Backend unit
cd backend
npm ci && npm run activity:smoke

# Full stack (requires MongoDB on localhost:27017)
cd backend
export MONGO_URI=mongodb://localhost:27017/rolebuddy
export JWT_SECRET=local-dev-secret-min-32-characters
npm start
# another terminal:
npm run ci:integration
cd ../frontend && npm run auth:check
```

## CD — container registry (GHCR)

On every push to `main`, images are published to:

- `ghcr.io/<github-owner>/rolebuddy-backend`
- `ghcr.io/<github-owner>/rolebuddy-frontend`

Tags include `latest` (default branch), branch name, git SHA, and semver tags when you push `v1.2.3`.

### Configure the public API URL for frontend images

The frontend bakes `NEXT_PUBLIC_API_BASE_URL` at **image build time**.

1. GitHub → **Settings** → **Secrets and variables** → **Actions** → **Variables**
2. Add `NEXT_PUBLIC_API_BASE_URL` = `https://api.your-staging-domain.com/api`

Re-run **Publish Docker images** after changing this variable.

### Pull images on a server

```bash
echo "$GITHUB_PAT" | docker login ghcr.io -u YOUR_USER --password-stdin
export GHCR_OWNER=your-github-username
export IMAGE_TAG=latest
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

Use `docker-compose.ghcr.example.yml` as the template (`cp` to `docker-compose.ghcr.yml` on the server).

## CD — manual staging deploy

The **Deploy staging** workflow never runs on push. Trigger it from **Actions → Deploy staging → Run workflow**.

### Required GitHub secrets

| Secret | Description |
|--------|-------------|
| `STAGING_HOST` | Server hostname or IP |
| `STAGING_USER` | SSH user |
| `STAGING_SSH_KEY` | Private key (PEM) |
| `STAGING_APP_DIR` | Directory containing `docker-compose.ghcr.yml` and `.env` |

Optional: `STAGING_SSH_PORT` (default `22`).

### Optional: GitHub Environment

Create an environment named `staging` with required reviewers for an extra approval gate before deploy.

## Security practices

- **No production secrets in workflows** — CI uses throwaway `JWT_SECRET` values.
- **Deploy is manual** — avoids accidental production pushes.
- **`GITHUB_TOKEN`** is scoped to the repository for GHCR pushes.
- **Dependabot** reduces exposure from outdated dependencies.
- **Concurrency** cancels outdated CI runs on the same branch.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Frontend build fails on `file:../backend` | Run the backend stub step (CI does this automatically) |
| Integration job times out on `/health` | MongoDB service not healthy; check `backend-server.log` artifact in the job log |
| GHCR pull 403 | Log in to `ghcr.io` on the server; grant `read:packages` on the PAT |
| Frontend app calls wrong API in staging | Rebuild frontend image with correct `NEXT_PUBLIC_API_BASE_URL` variable |

## Related docs

- [README.md](../README.md) — local development
- [TESTING.md](../TESTING.md) — manual smoke test status
- [docker-compose.yml](../docker-compose.yml) — local full stack from source
- [PRODUCTION_READINESS_AUDIT.md](../PRODUCTION_READINESS_AUDIT.md) — broader production checklist
