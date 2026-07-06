import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.deployQueue.deleteMany({});
    await prisma.deployment.deleteMany({
      where: { status: { in: ["BUILDING", "QUEUED"] } }
    });
    return NextResponse.json({ success: true, message: "Cleaned up stuck deployments" });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
