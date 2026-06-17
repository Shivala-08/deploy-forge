const VERCEL_BASE = "https://api.vercel.com";
const token = process.env.VERCEL_API_TOKEN!;
const teamId = process.env.VERCEL_TEAM_ID;

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function teamParams() {
  return teamId ? `?teamId=${teamId}` : "?";
}

// ── Projects ──────────────────────────────────────────────
export async function createVercelProject(
  name: string,
  repoFullName: string,
  framework: string
) {
  const res = await fetch(`${VERCEL_BASE}/v9/projects${teamParams()}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name,
      framework,
      gitRepository: {
        type: "github",
        repo: repoFullName,
      },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getVercelProject(projectId: string) {
  const res = await fetch(
    `${VERCEL_BASE}/v9/projects/${projectId}${teamParams()}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Deployments ───────────────────────────────────────────
export async function triggerDeployment(
  projectId: string,
  branch: string = "main"
) {
  const vercelProject = await getVercelProject(projectId);
  const name = vercelProject.name;
  const repoId = vercelProject.link?.repoId || vercelProject.gitRepository?.repoId;

  if (!repoId) {
    throw new Error("Vercel project is not linked to a Git repository");
  }

  const res = await fetch(`${VERCEL_BASE}/v13/deployments${teamParams()}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name,
      gitSource: {
        type: "github",
        ref: branch,
        repoId: String(repoId),
      },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDeployment(deploymentId: string) {
  const res = await fetch(
    `${VERCEL_BASE}/v13/deployments/${deploymentId}${teamParams()}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listDeployments(projectId: string, limit = 10) {
  const teamQ = teamId ? `&teamId=${teamId}` : "";
  const res = await fetch(
    `${VERCEL_BASE}/v6/deployments?projectId=${projectId}&limit=${limit}${teamQ}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelDeployment(deploymentId: string) {
  const res = await fetch(
    `${VERCEL_BASE}/v12/deployments/${deploymentId}/cancel${teamParams()}`,
    { method: "PATCH", headers: headers() }
  );
  return res.json();
}

// ── Environment Variables ─────────────────────────────────
export async function deleteEnvVar(projectId: string, envId: string) {
  const res = await fetch(
    `${VERCEL_BASE}/v9/projects/${projectId}/env/${envId}${teamParams()}`,
    {
      method: "DELETE",
      headers: headers(),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addEnvVar(
  projectId: string,
  key: string,
  value: string,
  target: string[]
) {
  const res = await fetch(
    `${VERCEL_BASE}/v10/projects/${projectId}/env${teamParams()}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        key,
        value,
        type: "plain",
        target,
      }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setEnvVars(
  projectId: string,
  vars: Array<{ key: string; value: string; target: string[] }>
) {
  const res = await fetch(
    `${VERCEL_BASE}/v9/projects/${projectId}/env${teamParams()}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(vars),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getEnvVars(projectId: string) {
  const res = await fetch(
    `${VERCEL_BASE}/v9/projects/${projectId}/env${teamParams()}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Domains ───────────────────────────────────────────────
export async function addDomain(projectId: string, domain: string) {
  const res = await fetch(
    `${VERCEL_BASE}/v9/projects/${projectId}/domains${teamParams()}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ name: domain }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listDomains(projectId: string) {
  const res = await fetch(
    `${VERCEL_BASE}/v9/projects/${projectId}/domains${teamParams()}`,
    { headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Build Logs (Server-Sent Events) ──────────────────────
export function getLogStreamUrl(deploymentId: string) {
  return `${VERCEL_BASE}/v2/deployments/${deploymentId}/events?token=${token}${teamId ? `&teamId=${teamId}` : ""}`;
}
