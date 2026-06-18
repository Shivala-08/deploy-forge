import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.NEXTAUTH_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deploymentId, status, error, runId } = await req.json();

  try {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status,
        errorMessage: error ?? null,
        ...(runId ? { workflowRunId: String(runId) } : {}),
        ...(status === "READY" || status === "ERROR" ? { completedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update deployment status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
