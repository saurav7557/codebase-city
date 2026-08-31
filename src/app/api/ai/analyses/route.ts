import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const analyses = await prisma.aiAnalysis.findMany({
      orderBy: { generatedAt: "desc" },
      take: 10,
    });

    return Response.json({ analyses });
  } catch (error) {
    console.error("Failed to fetch AI analyses:", error);
    return Response.json(
      { error: { code: "ANALYSES_FETCH_FAILED", message: "Failed to fetch AI analyses" } },
      { status: 500 }
    );
  }
}
