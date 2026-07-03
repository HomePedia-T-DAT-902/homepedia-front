export interface TransactionPoint {
	latitude: number;
	longitude: number;
	prix_m2_moyen: number;
	nb_transactions: number;
}

export interface PrixPointProperties {
	prixM2Moyen: number;
	nbTransactions: number;
}

/** Small square footprint per point, extruded into a 3D column on the map. */
export type PrixColumnFeatureCollection = GeoJSON.FeatureCollection<
	GeoJSON.Polygon,
	PrixPointProperties
>;

/** Raw point per transaction group, fed to a Mapbox `heatmap` layer for a smooth
 * blended price surface instead of discrete grid cells. */
export type PrixHeatFeatureCollection = GeoJSON.FeatureCollection<
	GeoJSON.Point,
	PrixPointProperties
>;
