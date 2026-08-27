import { getGitHubErrorResponse, syncGitHubRepositories } from "@/github/github-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    return Response.json(await syncGitHubRepositories());
  } catch (error: unknown) {
    return getGitHubErrorResponse(error);
  }
}
