import { getOctokit } from "@/lib/github";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const octokit = getOctokit();
    const owner = process.env.DEPLOYFORGE_REPO_OWNER || "Shivala-08";
    const repo = process.env.DEPLOYFORGE_REPO_NAME || "deploy-forge";
    
    const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: 27755041929,
    });

    const job = jobsData.jobs[0];
    if (!job) {
      return NextResponse.json({ error: "No jobs found" });
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
