import type { Feature, FeatureCollection, Geometry } from "geojson";

export interface CadastreFeatureProperties {
	id?: string | number;
	type: string;
	nom: string | null;
	commune: string;
	created: string;
	updated: string;
	[key: string]: unknown;
}

export type CadastreFeature = Feature<Geometry, CadastreFeatureProperties>;

export type CadastreFeatureCollection = FeatureCollection<
	Geometry,
	CadastreFeatureProperties
>;

export interface Bbox {
	west: number;
	south: number;
	east: number;
	north: number;
}
