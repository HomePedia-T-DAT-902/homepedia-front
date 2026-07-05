import { useQuery } from "@tanstack/react-query";
import { risqueRepository } from "../repositories/risqueRepository";
import {
	RISK_TYPE_LABEL,
	type RiskPointFeatureCollection,
	type RiskPointProperties,
	type RisqueGeopoint,
} from "../types/risques";
import { computeBboxFromRadius } from "../utils/geo";

function geopointToFeature(
	point: RisqueGeopoint,
): GeoJSON.Feature<GeoJSON.Point, RiskPointProperties> {
	return {
		type: "Feature",
		geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
		properties: {
			riskType: point.type_risque,
			label: RISK_TYPE_LABEL[point.type_risque],
		},
	};
}

export function useRiskPointsQuery(
	coordinates: [lng: number, lat: number] | null,
	radiusKm: number,
) {
	return useQuery({
		queryKey: ["risk-points", coordinates?.[0], coordinates?.[1], radiusKm],
		queryFn: async ({ signal }): Promise<RiskPointFeatureCollection> => {
			const bbox = computeBboxFromRadius(
				coordinates as [number, number],
				radiusKm,
			);
			const points = await risqueRepository.getGeopoints(bbox, { signal });
			return {
				type: "FeatureCollection",
				features: points.map(geopointToFeature),
			};
		},
		enabled: coordinates !== null,
		staleTime: 30 * 60_000,
		gcTime: 60 * 60_000,
		retry: 1,
	});
}
