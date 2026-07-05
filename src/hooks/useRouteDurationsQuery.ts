import { useQuery } from "@tanstack/react-query";
import type { Poi } from "../types/poi";
import type { RouteDurations } from "../types/route";

// Mapbox Matrix API allows at most 25 coordinates per request (origin + destinations)
const MAX_DESTINATIONS = 24;

async function fetchDurations(
	profile: "walking" | "driving",
	origin: [number, number],
	destinations: [number, number][],
	signal?: AbortSignal,
): Promise<(number | null)[]> {
	const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
	const coords = [origin, ...destinations]
		.map(([lng, lat]) => `${lng},${lat}`)
		.join(";");
	const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coords}?sources=0&access_token=${token}`;

	const res = await fetch(url, { signal });
	if (!res.ok) throw new Error(`Matrix fetch failed: ${res.status}`);
	const data: { durations?: (number | null)[][] } = await res.json();
	return (data.durations?.[0] ?? []).slice(1);
}

export function useRouteDurationsQuery(
	origin: [number, number] | null,
	pois: Poi[] | undefined,
) {
	const poiIds = pois?.map((p) => p.id).join(",") ?? "";

	return useQuery({
		queryKey: [
			"route-durations",
			origin?.[0]?.toFixed(4),
			origin?.[1]?.toFixed(4),
			poiIds,
		],
		queryFn: async ({ signal }) => {
			const targetPois = pois!.slice(0, MAX_DESTINATIONS);
			const destinations = targetPois.map((p) => p.coordinates);

			const [walking, driving] = await Promise.all([
				fetchDurations("walking", origin!, destinations, signal),
				fetchDurations("driving", origin!, destinations, signal),
			]);

			const result: Record<string, RouteDurations> = {};
			targetPois.forEach((poi, i) => {
				result[poi.id] = {
					walkingSec: walking[i] ?? null,
					drivingSec: driving[i] ?? null,
				};
			});
			return result;
		},
		enabled: origin != null && !!pois && pois.length > 0,
		staleTime: 5 * 60_000,
		gcTime: 15 * 60_000,
	});
}
