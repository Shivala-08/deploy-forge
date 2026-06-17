import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptEnvVars, decryptEnvVars } from "@/lib/encryption";
import { getEnvVars, deleteEnvVar, addEnvVar } from "@/lib/vercel";
import { NextResponse } from "next/server";

export async function GET(
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

  const envVars = await prisma.envVar.findMany({
    where: { projectId },
  });

  // Decrypt values before returning to the client
  const decrypted = await decryptEnvVars(envVars);

  return NextResponse.json(decrypted);
}

export async function POST(
  req: Request,
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

  const body = await req.json();
  const { vars } = body as {
    vars: Array<{ key: string; value: string; target: string }>;
  };

  if (project.vercelProjectId) {
    try {
      // 1. Fetch current env vars from Vercel
      const vercelEnvs = await getEnvVars(project.vercelProjectId);
      // 2. Delete all existing env vars on Vercel
      if (vercelEnvs && Array.isArray(vercelEnvs.envs)) {
        await Promise.all(
          vercelEnvs.envs.map((env: { id: string }) =>
            deleteEnvVar(project.vercelProjectId!, env.id)
          )
        );
      }
      // 3. Add new env vars to Vercel
      await Promise.all(
        vars.map((v) =>
          addEnvVar(project.vercelProjectId!, v.key, v.value, [v.target || "production"])
        )
      );
    } catch (vercelError) {
      console.error("Failed to sync env vars to Vercel:", vercelError);
      const message = vercelError instanceof Error ? vercelError.message : "Vercel sync failed";
      return NextResponse.json(
        { error: `Failed to sync env vars to Vercel: ${message}` },
        { status: 500 }
      );
    }
  }

  // Delete existing env vars in local DB
  await prisma.envVar.deleteMany({ where: { projectId } });

  // Encrypt values before storing in local DB
  const varsToStore = vars.map((v) => ({
    key: v.key,
    value: v.value,
    target: v.target || "production",
    projectId,
  }));
  const encrypted = await encryptEnvVars(varsToStore);

  const created = await prisma.envVar.createMany({
    data: encrypted,
  });

  return NextResponse.json({ count: created.count });
}
