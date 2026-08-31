import { getAIProviderStatus } from "@/ai/ai-provider-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return Response.json(getAIProviderStatus());
}
