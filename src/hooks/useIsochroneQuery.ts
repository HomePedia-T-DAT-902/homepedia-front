import { useQuery } from "@tanstack/react-query";
import type { IsochroneData } from "../types/isochrone";

export function useIsochroneQuery(coordinates: [number, number] | null) {
	return useQuery({
		queryKey: [
			"isochrone",
			coordinates?.[0]?.toFixed(4),
			coordinates?.[1]?.toFixed(4),
		],
		queryFn: async ({ signal }): Promise<IsochroneData> => {
			const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
			const [lng, lat] = coordinates!;
			const url = `https://api.mapbox.com/isochrone/v1/mapbox/walking/${lng},${lat}?contours_minutes=5,10,15&polygons=true&access_token=${token}`;
			const res = await fetch(url, { signal });
			if (!res.ok) throw new Error(`Isochrone fetch failed: ${res.status}`);
			const geojson: GeoJSON.FeatureCollection = await res.json();
			return { geojson };
		},
		enabled: coordinates !== null,
		staleTime: 30 * 60_000,
		gcTime: 60 * 60_000,
	});
}
