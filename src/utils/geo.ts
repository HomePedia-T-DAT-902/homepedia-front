export type BBox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

/**
 * Approximates a bounding box around a point for a given radius in km.
 * 1° latitude ≈ 111 km; longitude degrees shrink with cos(latitude).
 */
export function computeBboxFromRadius(
	[lng, lat]: [lng: number, lat: number],
	radiusKm: number,
): BBox {
	const latDelta = radiusKm / 111;
	const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

	return [lng - lngDelta, lat - latDelta, lng + lngDelta, lat + latDelta];
}
