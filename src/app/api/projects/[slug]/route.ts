import { getProjectBySlug } from "@/lib/city-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProjectRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _request: Request,
  { params }: ProjectRouteContext,
): Promise<Response> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json({ project });
}
