import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLogStreamUrl } from "@/lib/vercel";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { deploymentId: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deploymentId } = params;

  // Look up the deployment to get the Vercel deployment ID
  const deployment = await prisma.deployment.findFirst({
    where: {
      id: deploymentId,
      project: { userId: session.user.id },
    },
  });

  if (!deployment)
    return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

  if (!deployment.vercelDeployId)
    return NextResponse.json(
      { error: "No Vercel deployment linked" },
      { status: 400 }
    );

  const vercelUrl = getLogStreamUrl(deployment.vercelDeployId);

  const response = await fetch(vercelUrl);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: response.status }
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
