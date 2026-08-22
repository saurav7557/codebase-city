import { getDistricts } from "@/lib/city-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return Response.json({ districts: await getDistricts() });
}
