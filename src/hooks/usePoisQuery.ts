import { useQuery } from "@tanstack/react-query";
import type { CategoryId } from "../components/FloatingPanel";
import type { Poi } from "../types/poi";

type PoiCategoryId = Exclude<
	CategoryId,
	"air" | "isochrone" | "risks" | "city"
>;

const MAPBOX_CATEGORY: Record<PoiCategoryId, string> = {
	schools: "school",
	health: "hospital,pharmacy",
	shops: "grocery,convenience_store",
	transport: "bus_station,train_station",
	parks: "park,playground,sports_complex",
};

const TYPE_LABELS: Record<string, string> = {
	school: "École",
	hospital: "Hôpital",
	pharmacy: "Pharmacie",
	grocery: "Épicerie",
	convenience_store: "Commerce",
	bus_station: "Bus",
	train_station: "Train",
	subway_station: "Métro",
	park: "Parc",
	playground: "Aire de jeux",
	sports_complex: "Complexe sportif",
};

type MapboxFeature = {
	properties: {
		mapbox_id: string;
		name: string;
		poi_category?: string[];
		distance?: number;
	};
	geometry: { coordinates: [number, number] };
};

function computeBbox(
	lng: number,
	lat: number,
	radiusKm: number,
): [number, number, number, number] {
	const latRad = lat * (Math.PI / 180);
	const dlat = radiusKm / 110.574;
	const dlng = radiusKm / (111.32 * Math.cos(latRad));
	return [lng - dlng, lat - dlat, lng + dlng, lat + dlat];
}

async function fetchPois(
	mapboxCategory: string,
	coordinates: [number, number],
	radiusKm: number,
	signal?: AbortSignal,
): Promise<Poi[]> {
	const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
	const [lng, lat] = coordinates;
	const bbox = computeBbox(lng, lat, radiusKm).join(",");
	const url = `https://api.mapbox.com/search/searchbox/v1/category/${mapboxCategory}?proximity=${lng},${lat}&bbox=${bbox}&limit=20&language=fr&access_token=${token}`;

	const res = await fetch(url, { signal });
	if (!res.ok) throw new Error(`POI fetch failed: ${res.status}`);
	const data: { features?: MapboxFeature[] } = await res.json();

	const radiusM = radiusKm * 1000;
	return (data.features ?? [])
		.filter(
			(f) => f.properties.distance == null || f.properties.distance <= radiusM,
		)
		.map((f) => {
			const rawType = f.properties.poi_category?.[0] ?? "";
			return {
				id: f.properties.mapbox_id,
				name: f.properties.name,
				type: TYPE_LABELS[rawType] ?? rawType,
				distance:
					f.properties.distance != null
						? `${Math.round(f.properties.distance)} m`
						: "—",
				distanceM: f.properties.distance,
				coordinates: f.geometry.coordinates,
			};
		});
}

export function usePoisQuery(
	category: CategoryId | null,
	coordinates: [number, number] | null,
	radiusKm = 5,
) {
	const NON_POI_CATEGORIES = new Set<CategoryId>([
		"isochrone",
		"risks",
		"city",
	]);
	const mapboxCategory =
		category != null && !NON_POI_CATEGORIES.has(category)
			? MAPBOX_CATEGORY[category as PoiCategoryId]
			: null;

	return useQuery({
		queryKey: [
			"pois",
			category,
			coordinates?.[0]?.toFixed(4),
			coordinates?.[1]?.toFixed(4),
			radiusKm,
		],
		queryFn: ({ signal }) =>
			fetchPois(mapboxCategory!, coordinates!, radiusKm, signal),
		enabled: mapboxCategory != null && coordinates != null,
		staleTime: 5 * 60_000,
		gcTime: 15 * 60_000,
	});
}
