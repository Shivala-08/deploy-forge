import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOctokit } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { deploymentId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deploymentId } = params;

  const deployment = await prisma.deployment.findFirst({
    where: {
      id: deploymentId,
      site: { userId: session.user.id },
    },
  });

  if (!deployment)
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

  if (!deployment.workflowRunId) {
    return NextResponse.json({
      status: deployment.status,
      steps: [
        { name: "Queuing deployment on GitHub...", status: "completed", conclusion: "success" }
      ]
    });
  }

  try {
    const octokit = getOctokit();
    const owner = process.env.DEPLOYFORGE_REPO_OWNER!;
    const repo = process.env.DEPLOYFORGE_REPO_NAME!;

    const { data: jobsData } = await octokit.actions.listJobsForWorkflowRun({
      owner,
      repo,
      run_id: parseInt(deployment.workflowRunId),
    });

    const job = jobsData.jobs[0];
    if (!job) {
      return NextResponse.json({
        status: deployment.status,
        steps: []
      });
    }

    return NextResponse.json({
      status: deployment.status,
      steps: (job.steps || []).map((s) => ({
        name: s.name,
        status: s.status, // "queued", "in_progress", "completed"
        conclusion: s.conclusion, // "success", "failure", "skipped", null
        startedAt: s.started_at,
        completedAt: s.completed_at,
      })),
      errorMessage: deployment.errorMessage
    });
  } catch (error) {
    return NextResponse.json({
      status: deployment.status,
      steps: [],
      error: error instanceof Error ? error.message : "Failed to fetch workflow details"
    });
  }
}
