import { getOctokit } from "@/lib/github";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const octokit = getOctokit();
    const owner = process.env.DEPLOYFORGE_REPO_OWNER || "Shivala-08";
    const repo = process.env.DEPLOYFORGE_REPO_NAME || "deploy-forge";
    
    const { data: runsData } = await octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: "deploy-site.yml",
      per_page: 5,
    });

    const runs = runsData.workflow_runs.map(r => ({
      id: r.id,
      status: r.status,
      conclusion: r.conclusion,
      created_at: r.created_at,
    }));

    // Find the latest failed run
    const failedRun = runsData.workflow_runs.find(r => r.conclusion === "failure");
    if (!failedRun) {
      return NextResponse.json({ error: "No failed runs found", runs });
    }

    const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: failedRun.id,
    });

    const job = jobsData.jobs[0];
    if (!job) {
      return NextResponse.json({ error: "No jobs found", failedRun });
    }

    const { data: logData } = await octokit.actions.downloadJobLogsForWorkflowRun({
      owner,
      repo,
      job_id: job.id,
    });

    return new NextResponse(logData as string, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
