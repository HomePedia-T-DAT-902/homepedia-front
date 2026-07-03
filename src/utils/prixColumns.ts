import type { PrixColumnFeatureCollection, TransactionPoint } from "../types/prix";

const DEFAULT_COLUMN_SIZE_DEG = 0.0004;

/**
 * Turns each DVF point into a small square footprint so it can be rendered
 * as a `fill-extrusion` column on the map (Mapbox extrusion needs a polygon,
 * not a point geometry).
 */
export function pointsToColumns(
	points: TransactionPoint[],
	sizeDeg = DEFAULT_COLUMN_SIZE_DEG,
): PrixColumnFeatureCollection {
	const half = sizeDeg / 2;

	return {
		type: "FeatureCollection",
		features: points.map((point) => {
			const minLon = point.longitude - half;
			const maxLon = point.longitude + half;
			const minLat = point.latitude - half;
			const maxLat = point.latitude + half;

			return {
				type: "Feature",
				geometry: {
					type: "Polygon",
					coordinates: [
						[
							[minLon, minLat],
							[maxLon, minLat],
							[maxLon, maxLat],
							[minLon, maxLat],
							[minLon, minLat],
						],
					],
				},
				properties: {
					prixM2Moyen: point.prix_m2_moyen,
					nbTransactions: point.nb_transactions,
				},
			};
		}),
	};
}
