# DeployForge — Systems Architecture

This document describes the design and components of DeployForge, a self-hosted, Git-backed deployment infrastructure for hosting user-submitted static sites.

---

## 1. Architectural Flow Diagram

```text
  User Dashboard (Next.js App UI)
              │
              ▼
   Deploy API Endpoint (FastAPI/Next.js Route)
              │
              ▼ (Dispatches 'deploy-site' event via GitHub API)
     GitHub Actions Runner (Isolated Worker)
              │
      ┌───────┴───────────────────────────────┐
      ▼                                       ▼
  [Clone & Build Phase]            [Sub-path Rewriting]
  - Clone user target repo         - Search all built HTML files
  - Run npm install & build        - Regex rewrite absolute asset links
                                     (href="/ -> href="/sites/{id}/)
                                              │
              ┌───────────────────────────────┘
              ▼
    Commit & Push Artifacts
              │ (Pushes back to parent repository main branch)
              ▼
    Vercel Automatic Deploy
              │ (Bundles the public/sites/{id} directory)
              ▼
    Dynamic Router Middleware
              │ (Serves public/sites/{id} assets)
              ▼
          Live Site
```

---

## 2. Component Teardown

### 2.1 API Ingestion Layer
* **Location:** [`app/api/deploy/route.ts`](../app/api/deploy/route.ts)
* **Why it's here:** Initiates the deployment pipeline. Authenticates the request, registers the deployment record in the database as `QUEUED`, and dispatches the build trigger.
* **Limitations:** Synchronous request cycle. If the GitHub API experiences high latency, the request will block. Future mitigation: move trigger mechanism to an asynchronous task queue (e.g. BullMQ or Celery).

### 2.2 Isolated Build Runner
* **Location:** [`.github/workflows/deploy-site.yml`](../.github/workflows/deploy-site.yml)
* **Why it's here:** Compiling untrusted user code (`npm run build`) is resource-intensive and presents severe security risks (malicious code execution). Offloading this to isolated, free GitHub Actions runners keeps the primary Next.js serverless application secure and lightweight.
* **Limitations:** cold-start delays. It takes between 10–30s for the Actions runner to initialize and spawn the build container.

### 2.3 Asset Sub-path Path Rewriter
* **Location:** [`scripts/rewrite-paths.js`](../scripts/rewrite-paths.js)
* **Why it's here:** Static sites compile assuming they are hosted at the root domain (`/`). When hosted on a platform sub-path (`/sites/{id}/`), absolute references like `<link href="/style.css">` break. The script walks the compiled HTML and CSS files and rewrites root-relative links to point to the sub-path.
* **Limitations:** Regex replacement is brittle. Dynamic links generated in Javascript at runtime (e.g. `const api = "/api/data"`) will not be captured.

### 2.4 Git-Backed Persistence & Vercel
* **Why it's here:** Built artifacts are pushed back to the host repository's `main` branch. This triggers Vercel to automatically redeploy the platform.
* **Limitations:** Vercel deployment propagation latency. Every new site push triggers a full redeployment of the DeployForge platform, introducing a 30–60s delay before the site becomes live.
