import { useQuery } from "@tanstack/react-query";
import { prixRepository } from "../repositories/prixRepository";
import type {
	PrixColumnFeatureCollection,
	PrixHeatFeatureCollection,
	TransactionPoint,
} from "../types/prix";
import { computeBboxFromRadius } from "../utils/geo";
import { pointsToColumns } from "../utils/prixColumns";

function pointToHeatFeature(
	point: TransactionPoint,
): GeoJSON.Feature<GeoJSON.Point, { prixM2Moyen: number; nbTransactions: number }> {
	return {
		type: "Feature",
		geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
		properties: {
			prixM2Moyen: point.prix_m2_moyen,
			nbTransactions: point.nb_transactions,
		},
	};
}

/** Linear-interpolated percentile over a sorted array — used to keep the price color
 * scale readable, since a handful of outlier sales (garages, land-only, luxury) would
 * otherwise stretch a raw min/max domain and crush every normal price into one hue. */
function percentile(sorted: number[], p: number): number {
	if (sorted.length === 0) return 0;
	const idx = (sorted.length - 1) * p;
	const lower = Math.floor(idx);
	const upper = Math.ceil(idx);
	if (lower === upper) return sorted[lower];
	return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

export interface PrixPointsData {
	columnsGeoJson: PrixColumnFeatureCollection;
	heatmapGeoJson: PrixHeatFeatureCollection;
	minPrice: number;
	maxPrice: number;
	nbPoints: number;
	nbTransactionsTotal: number;
}

export function usePrixPointsQuery(
	coordinates: [lng: number, lat: number] | null,
	radiusKm: number,
) {
	return useQuery({
		queryKey: ["prix-points", coordinates?.[0], coordinates?.[1], radiusKm],
		queryFn: async ({ signal }): Promise<PrixPointsData> => {
			const bbox = computeBboxFromRadius(
				coordinates as [number, number],
				radiusKm,
			);
			const points = await prixRepository.getPoints(bbox, { signal });

			const prices = points.map((p) => p.prix_m2_moyen).sort((a, b) => a - b);
			const nbTransactionsTotal = points.reduce(
				(sum, p) => sum + p.nb_transactions,
				0,
			);

			return {
				columnsGeoJson: pointsToColumns(points),
				heatmapGeoJson: {
					type: "FeatureCollection",
					features: points.map(pointToHeatFeature),
				},
				minPrice: Math.round(percentile(prices, 0.05)),
				maxPrice: Math.round(percentile(prices, 0.95)),
				nbPoints: points.length,
				nbTransactionsTotal,
			};
		},
		enabled: coordinates !== null,
		staleTime: 30 * 60_000,
		gcTime: 60 * 60_000,
		retry: 1,
	});
}
