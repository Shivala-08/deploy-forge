import { Octokit } from "@octokit/rest";

export function getOctokit(token?: string) {
  return new Octokit({ auth: token || process.env.GITHUB_PAT });
}

// List user repos
export async function listUserRepos(token: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    type: "owner",
  });
  return data.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    name: r.name,
    private: r.private,
    updated_at: r.updated_at ?? "",
    language: r.language ?? null,
    default_branch: r.default_branch ?? "main",
  }));
}

// Get single repo
export async function getRepo(token: string, repoFullName: string) {
  const octokit = getOctokit(token);
  const [owner, repo] = repoFullName.split("/");
  const { data } = await octokit.repos.get({ owner, repo });
  return data;
}

// Get latest commit on a branch
export async function getLatestCommit(repoFullName: string, branch: string, token?: string) {
  const octokit = getOctokit(token);
  const [owner, repo] = repoFullName.split("/");
  const { data } = await octokit.repos.getBranch({ owner, repo, branch });
  return {
    sha: data.commit.sha.slice(0, 7),
    message: data.commit.commit.message,
    author: data.commit.commit.author?.name,
  };
}

// Trigger the deploy workflow
export async function triggerDeployWorkflow(payload: {
  siteId: string;
  repoFullName: string;
  buildCommand: string;
  outputDir: string;
  commitSha: string;
  deploymentId: string;
  callbackUrl: string;
  callbackToken: string;
}) {
  const octokit = getOctokit();
  await octokit.repos.createDispatchEvent({
    owner: process.env.DEPLOYFORGE_REPO_OWNER!,
    repo: process.env.DEPLOYFORGE_REPO_NAME!,
    event_type: "deploy-site",
    client_payload: payload,
  });
}

// Poll workflow run status
export async function getWorkflowRunStatus(runId: number) {
  const octokit = getOctokit();
  const { data } = await octokit.actions.getWorkflowRun({
    owner: process.env.DEPLOYFORGE_REPO_OWNER!,
    repo: process.env.DEPLOYFORGE_REPO_NAME!,
    run_id: runId,
  });
  return {
    status: data.status,      // "queued" | "in_progress" | "completed"
    conclusion: data.conclusion, // "success" | "failure" | null
    url: data.html_url,
  };
}
