import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVercelProject } from "@/lib/vercel";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      deployments: { orderBy: { triggeredAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, repoFullName, repoBranch, framework, buildCommand, outputDir } =
    body;

  try {
    const vercelProject = await createVercelProject(
      name,
      repoFullName,
      framework
    );

    const project = await prisma.project.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        repoFullName,
        repoBranch: repoBranch || "main",
        framework,
        buildCommand,
        outputDir,
        vercelProjectId: vercelProject.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create project";
    if (message.includes("429")) {
      return NextResponse.json(
        { error: "Vercel API rate limit reached. Try again in a few seconds." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
