import {
  getGitHubErrorResponse,
  getPublicGitHubRepositories,
  GITHUB_USERNAME,
} from "@/github/github-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const repositories = await getPublicGitHubRepositories();
    return Response.json(
      { username: GITHUB_USERNAME, repositories },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch (error: unknown) {
    return getGitHubErrorResponse(error);
  }
}
