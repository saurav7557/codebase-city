import { syncCityState } from "@/services/city-state-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    return Response.json(await syncCityState());
  } catch {
    return Response.json(
      { error: { code: "CITY_SYNC_FAILED", message: "City synchronization could not be completed." } },
      { status: 500 },
    );
  }
}
