import { NextResponse } from "next/server";
import { cellToLatLng, getResolution, isValidCell } from "h3-js";
import { fetchPlaces } from "@/lib/daily/fetchPlaces";
import { searchRadiusFor } from "@/lib/daily/spotPlace";

/**
 * Named public places around a neighbourhood, for the Spot game. Takes the
 * neighbourhood's H3 cell, never a person's coordinates, and caches results
 * for a day at the edge.
 */
export async function GET(request: Request) {
  const cell = new URL(request.url).searchParams.get("cell");
  if (!cell || !isValidCell(cell)) {
    return NextResponse.json({ ok: false, error: "cell must be a valid H3 cell ID." }, { status: 400 });
  }
  const res = getResolution(cell);
  if (res < 5 || res > 9) {
    return NextResponse.json({ ok: false, error: "cell must be a neighbourhood cell (resolution 5 to 9)." }, { status: 400 });
  }
  const [lat, lng] = cellToLatLng(cell);
  const radius = searchRadiusFor(res);

  let result = await fetchPlaces(lat, lng, radius);
  if (result.places.length === 0 && result.endpoint) {
    result = await fetchPlaces(lat, lng, radius * 2);
  }
  if (!result.endpoint) {
    return NextResponse.json(
      { ok: false, error: "OpenStreetMap place search is unavailable right now.", details: result.errors },
      { status: 502 },
    );
  }
  return NextResponse.json(
    { ok: true, places: result.places, source: result.endpoint },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } },
  );
}
