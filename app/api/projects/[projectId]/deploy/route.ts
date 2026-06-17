import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerDeployment, getVercelProject } from "@/lib/vercel";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.vercelProjectId)
    return NextResponse.json(
      { error: "No Vercel project linked" },
      { status: 400 }
    );

  try {
    const vercelDeploy = await triggerDeployment(
      project.vercelProjectId,
      project.repoBranch
    );

    const deployment = await prisma.deployment.create({
      data: {
        vercelDeployId: vercelDeploy.id,
        status: "QUEUED",
        projectId: project.id,
        commitSha: vercelDeploy.meta?.githubCommitSha ?? null,
        commitMessage: vercelDeploy.meta?.githubCommitMessage ?? null,
        url: vercelDeploy.url ? `https://${vercelDeploy.url}` : null,
      },
    });

    // Fetch production URL from Vercel and update project if not yet set
    if (!project.vercelUrl && project.vercelProjectId) {
      try {
        const vercelProject = await getVercelProject(project.vercelProjectId);
        const prodAlias: string | undefined =
          vercelProject?.targets?.production?.deployments?.[0]?.alias?.[0];
        if (prodAlias) {
          await prisma.project.update({
            where: { id: project.id },
            data: { vercelUrl: `https://${prodAlias}` },
          });
        }
      } catch {
        // Non-critical: production URL will be fetched on next deploy
      }
    }

    return NextResponse.json(deployment, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger deployment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
