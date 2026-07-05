import { prisma } from "@/lib/prisma";
import { triggerDeployWorkflow } from "@/lib/github";
import { randomBytes } from "crypto";

export async function processNextInQueue() {
  const next = await prisma.deployQueue.findFirst({
    where: { status: "WAITING" },
    orderBy: { createdAt: "asc" },
    include: {
      deployment: true,
      site: true,
    },
  });

  if (!next) return;

  const callbackToken = randomBytes(32).toString("hex");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.deployQueue.update({
        where: { id: next.id },
        data: { status: "PROCESSING" },
      });

      await tx.deployment.update({
        where: { id: next.deploymentId },
        data: { status: "BUILDING", callbackToken },
      });
    });

    await triggerDeployWorkflow({
      siteId: next.site.siteId,
      repoFullName: next.site.repoFullName,
      repoBranch: next.site.repoBranch,
      buildCommand: next.site.buildCommand,
      outputDir: next.site.outputDir,
      commitSha: next.deployment.commitSha ?? "",
      deploymentId: next.deploymentId,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/deploy/status`,
      callbackToken,
    });
  } catch (error) {
    console.error("Failed to process queue:", error);
    await prisma.$transaction(async (tx) => {
      await tx.deployQueue.update({
        where: { id: next.id },
        data: { status: "WAITING" },
      });
      await tx.deployment.update({
        where: { id: next.deploymentId },
        data: { status: "QUEUED" },
      });
    });
  }
}
