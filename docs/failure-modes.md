# DeployForge — Failure Modes & Recovery

This document explains what happens when components of the deployment pipeline stop working, and how the system handles failure recovery.

---

## 1. Pipeline Failure Matrix

| Failure Event | System Behavior | Recruiter/User Impact | Recovery Action |
|---|---|---|---|
| **Build Compile Error** | The Actions compiler fails (e.g. syntax error in user repo). | The runner catches the non-zero exit code, updates the API to `FAILED`, and uploads build logs. | User receives a compilation error card on their dashboard with stdout logs. |
| **Path Rewriter Crash** | Script fails to parse or rewrite assets (e.g. malformed HTML). | Build is aborted. Pipeline updates API status to `FAILED`. | Developer inspects runner logs. Future mitigation: fallback to serving raw assets with warning. |
| **Vercel Deploy Timeout** | Pushed commit triggers Vercel build, but Vercel fails to compile. | The platform UI remains in `BUILDING` state or times out. | The API polls Vercel deployments, transitions state to `FAILED` if build takes >3 mins. |
| **Concurrent Deploys** | Two users trigger builds at the same time. | Runs queue up on the GitHub runner. | GitHub Actions queues workflows automatically. API handles asynchronous statuses. |
| **Invalid Repository URL** | User submits a private or non-existent repository. | API validation rejects request before dispatching event. | UI displays "Repository not found or private." |

---

## 2. Deep Dive: Handling Build Failures Safely

When a build fails inside the GitHub Actions runner, the system executes a trap handler in the workflow script:

```bash
# Capture compile failure
npm run build || { 
  curl -X POST -H "Content-Type: application/json" \
    -d '{"status": "FAILED", "error": "Build compilation failed"}' \
    https://deploy-forge.vercel.app/api/deploy/status
  exit 1
}
```

This ensures that the parent API is **always notified** of the failure status, avoiding orphaned `BUILDING` states on the dashboard.
