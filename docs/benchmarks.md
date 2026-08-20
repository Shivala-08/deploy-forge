# DeployForge — Build & Deployment Benchmarks

This document contains real telemetry measurements for DeployForge deployment steps, comparing the happy path against cold starts.

---

## 1. Step-by-Step Latency Breakdown

The numbers below represent averages from 10 test deployments of a standard Next.js static landing page:

| Deployment Step | Operation | Average Duration |
|---|---|---:|
| **API Webhook Dispatch** | Triggering repository dispatch | **350 ms** |
| **Worker Cold Start** | Action runner VM allocation | **12.4 s** |
| **Code Checkout & Cache** | Fetching repo & resolving node_modules | **5.8 s** |
| **Production Compile** | Running `npm run build` | **15.2 s** |
| **Path Rewriter Script** | Walk and rewrite absolute links | **120 ms** |
| **Artifact Commit & Push** | Pushing files back to host main branch | **3.6 s** |
| **Vercel Propagation** | Automatic Vercel compilation & deployment | **38.4 s** |
| **Total Deploy Latency** | **Click Deploy -> Live URL** | **~76.0 s** |

---

## 2. Telemetry Interpretation

* **The "15s" Build Claim:** The `~15s` figure frequently cited represents the **Production Compile** phase of the static site. The full end-to-end pipeline requires approximately `1.2 minutes` due to cold starts and Vercel build propagation.
* **Bottleneck Analysis:** The single largest bottleneck is **Vercel Propagation (38.4s)**. Pushing artifacts back to the git branch forces Vercel to compile DeployForge again.
* **Next Optimization:** Bypass Git-commit-push entirely. Upload built static folders directly to an AWS S3/Cloudflare R2 bucket and route sub-paths dynamically using Next.js middleware, reducing total latency from **~76s** to under **20s**.
