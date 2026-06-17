import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDomain } from "@/lib/vercel";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, domain } = body;

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
    await addDomain(project.vercelProjectId, domain);

    await prisma.project.update({
      where: { id: projectId },
      data: { customDomain: domain },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add domain";
    if (message.includes("409")) {
      return NextResponse.json(
        {
          error:
            "This domain is already in use by another project. Please use a different domain.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
