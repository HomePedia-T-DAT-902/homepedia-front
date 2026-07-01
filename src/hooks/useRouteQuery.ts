import { useQuery } from "@tanstack/react-query";

export function useRouteQuery(
	origin: [number, number] | null,
	destination: [number, number] | null,
) {
	return useQuery({
		queryKey: [
			"route",
			origin?.[0]?.toFixed(5),
			origin?.[1]?.toFixed(5),
			destination?.[0]?.toFixed(5),
			destination?.[1]?.toFixed(5),
		],
		queryFn: async ({ signal }): Promise<GeoJSON.FeatureCollection> => {
			const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
			const [oLng, oLat] = origin!;
			const [dLng, dLat] = destination!;
			const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&access_token=${token}`;

			const res = await fetch(url, { signal });
			if (!res.ok) throw new Error(`Directions fetch failed: ${res.status}`);
			const data: { routes?: { geometry: GeoJSON.Geometry }[] } =
				await res.json();
			const geometry = data.routes?.[0]?.geometry;

			return {
				type: "FeatureCollection",
				features: geometry
					? [{ type: "Feature", properties: {}, geometry }]
					: [],
			};
		},
		enabled: origin != null && destination != null,
		staleTime: 5 * 60_000,
		gcTime: 15 * 60_000,
	});
}
