import { useQuery } from "@tanstack/react-query";
import type { CategoryId } from "../components/FloatingPanel";
import type { Poi } from "../types/poi";
import { computeBboxFromRadius } from "../utils/geo";

type PoiCategoryId = Exclude<
	CategoryId,
	"isochrone" | "risks" | "city" | "prix"
>;

const MAPBOX_CATEGORY: Record<PoiCategoryId, string> = {
	schools: "school",
	health: "hospital,pharmacy",
	shops: "grocery,convenience_store",
	// "train_station"/"subway_station" ne sont pas des catégories Mapbox valides
	// (vérifié via /list/category) — railway_station couvre le train,
	// public_transportation_station couvre le métro/tram sans desserte ferrée.
	transport: "bus_station,railway_station,public_transportation_station",
	// "sports_complex" n'existe pas non plus côté Mapbox (0 résultat) ; le bon id est sports_center.
	parks: "park,playground,sports_center",
};

const TYPE_LABELS: Record<string, string> = {
	school: "École",
	hospital: "Hôpital",
	pharmacy: "Pharmacie",
	grocery: "Épicerie",
	convenience_store: "Commerce",
	bus_station: "Gare routière",
	bus_stop: "Bus",
	railway_station: "Train",
	public_transportation_station: "Métro",
	light_rail_station: "Tram",
	park: "Parc",
	playground: "Aire de jeux",
	sports_center: "Complexe sportif",
};

// Un POI Mapbox peut porter plusieurs tags à la fois (ex: une station Châtelet
// a "railway_station" ET "public_transportation_station") — cet ordre fixe
// choisit le libellé le plus pertinent plutôt que de dépendre de l'ordre
// renvoyé par l'API.
const TYPE_PRIORITY = [
	"railway_station",
	"light_rail_station",
	"public_transportation_station",
	"bus_station",
	"bus_stop",
	"school",
	"hospital",
	"pharmacy",
	"grocery",
	"convenience_store",
	"sports_center",
	"park",
	"playground",
];

function resolveType(ids: string[] | undefined, fallback: string): string {
	const key = ids ? TYPE_PRIORITY.find((k) => ids.includes(k)) : undefined;
	return key ? TYPE_LABELS[key] : fallback;
}

type MapboxFeature = {
	properties: {
		mapbox_id: string;
		name: string;
		poi_category?: string[];
		poi_category_ids?: string[];
		distance?: number;
	};
	geometry: { coordinates: [number, number] };
};

async function fetchPois(
	mapboxCategory: string,
	coordinates: [number, number],
	radiusKm: number,
	signal?: AbortSignal,
): Promise<Poi[]> {
	const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
	const [lng, lat] = coordinates;
	const bbox = computeBboxFromRadius(coordinates, radiusKm).join(",");
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
			const fallback = f.properties.poi_category?.[0] ?? "";
			return {
				id: f.properties.mapbox_id,
				name: f.properties.name,
				type: resolveType(f.properties.poi_category_ids, fallback),
				distance:
					f.properties.distance != null
						? `${Math.round(f.properties.distance)} m`
						: "—",
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
