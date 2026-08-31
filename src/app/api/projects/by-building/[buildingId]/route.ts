import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ buildingId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const { buildingId } = await context.params;

    const project = await prisma.project.findFirst({
      where: {
        building: {
          id: buildingId,
        },
      },
      include: {
        district: {
          select: {
            name: true,
          },
        },
        technologies: {
          include: {
            technology: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return Response.json(
        { error: { code: "PROJECT_NOT_FOUND", message: "Project not found for this building" } },
        { status: 404 }
      );
    }

    return Response.json({ project });
  } catch (error) {
    console.error("Failed to fetch project by building:", error);
    return Response.json(
      { error: { code: "PROJECT_FETCH_FAILED", message: "Failed to fetch project" } },
      { status: 500 }
    );
  }
}
