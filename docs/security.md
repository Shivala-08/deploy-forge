# DeployForge — Security Model & Trust Boundaries

This document defines the security boundaries, threats, and mitigations implemented in the DeployForge deployment pipeline.

---

## 1. Threat Profile: Arbitrary Code Execution

Hosting user-submitted static sites requires executing build commands (like `npm run build` or `npm install`) defined by untrusted external users. This represents an **Arbitrary Code Execution** threat, which can lead to:

1. **Host Compromise:** Malicious code gaining access to the host server or network.
2. **Secret Exfiltration:** Stealing database credentials, deployment tokens, or API keys.
3. **Resource Abuse:** Cryptomining or launching DDoS attacks from the build runner.

---

## 2. Security Boundaries & Mitigations

```text
       UNTRUSTED ZONE              │             TRUSTED ZONE
 (User Repo / Build Command)       │        (Next.js Core / DB)
                                   │
      [External GitHub]            │       [Serverless Host (Vercel)]
              │                    │                   ▲
              ▼                    │                   │
   [GitHub Actions Runner] ────────┼───────►  [DeployForge API]
  - Ephemeral VMs (Ubuntu)         │         - Validates repository URL
  - Untrusted code execution       │         - Signs webhook payloads
  - No access to DB credentials    │         - Stores environment keys
```

### 2.1 Worker Isolation
* **Mitigation:** Build execution is completely offloaded to ephemeral GitHub-hosted runners (`ubuntu-latest`). No build operations run on the primary application host.
* **Residual Risk:** A compromised runner has access to its local container. However, because GitHub Actions VMs are destroyed immediately after run completion, persistence is impossible.

### 2.2 Secret Protection
* **Mitigation:** The database credentials (`DATABASE_URL`) and Vercel project deployment tokens are **never** exposed to the GitHub Actions runner environment. The runner only communicates status updates via signed HTTPS webhook callbacks containing limited deployment IDs.
* **Encryption:** Repository configuration and custom environment variables are encrypted at rest using AES-256-GCM.

### 2.3 Repository Validation
* **Mitigation:** The API validates that user repository URLs point to legitimate, public GitHub repositories before scheduling any build workflows, preventing command injection during pipeline dispatch.

---

## 3. Current Limitations & Roadmap

* **Concurrent Runner Limits:** GitHub Actions runs have a limited number of concurrent executions. High load can cause build queues to back up.
* **Future Isolation Strategy:** Migrate build execution to isolated Docker containers running inside firewalled AWS Fargate or Fly.io VMs, terminating build runners if execution time exceeds 60 seconds.
