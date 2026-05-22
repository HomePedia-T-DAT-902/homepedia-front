import type { Feature, FeatureCollection, Polygon } from "geojson";

export interface IrisFeatureProperties {
	code_iris: string;
	nom_iris: string;
	type_iris: "H" | "A" | "D";
}

export type IrisFeature = Feature<Polygon, IrisFeatureProperties>;

export type IrisFeatureCollection = FeatureCollection<
	Polygon,
	IrisFeatureProperties
>;
