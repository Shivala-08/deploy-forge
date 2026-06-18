import { prisma } from "@/lib/prisma";
import { getOctokit } from "@/lib/github";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sites = await prisma.site.findMany();
    const deployments = await prisma.deployment.findMany({
      orderBy: { triggeredAt: "desc" },
      take: 10,
    });
    
    const octokit = getOctokit();
    const owner = process.env.DEPLOYFORGE_REPO_OWNER || "Shivala-08";
    const repo = process.env.DEPLOYFORGE_REPO_NAME || "deploy-forge";
    
    const { data: runsData } = await octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: "deploy-site.yml",
      per_page: 5,
    });

    const latestRun = runsData.workflow_runs[0];
    let logs = "No runs found";
    
    if (latestRun) {
      const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: latestRun.id,
      });

      const job = jobsData.jobs[0];
      if (job) {
        const { data: logData } = await octokit.actions.downloadJobLogsForWorkflowRun({
          owner,
          repo,
          job_id: job.id,
        });
        logs = logData as string;
      }
    }

    return NextResponse.json({ sites, deployments, logs: logs.slice(-10000) });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
