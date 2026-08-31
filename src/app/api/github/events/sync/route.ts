import {
  getGitHubErrorResponse,
} from "@/github/github-service";
import { syncGitHubEngineeringEvents } from "@/github/github-event-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    return Response.json(await syncGitHubEngineeringEvents());
  } catch (error: unknown) {
    return getGitHubErrorResponse(error);
  }
}
