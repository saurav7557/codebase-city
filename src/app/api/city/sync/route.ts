import { syncCityState } from "@/services/city-state-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    const summary = await syncCityState();
    return Response.json({ success: true, summary });
  } catch (error) {
    console.error("City sync failed:", error);
    return Response.json(
      { error: { code: "CITY_SYNC_FAILED", message: "Failed to sync city state" } },
      { status: 500 }
    );
  }
}
