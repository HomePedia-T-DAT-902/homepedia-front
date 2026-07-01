export type RiskLevel = "Nul" | "Faible" | "Modéré" | "Fort" | "Très fort";

export interface RiskItem {
	libelle: string;
	niveau: RiskLevel;
}

export interface AirQualityPollutant {
	name: string;
	value: number;
	max: number;
	unit: string;
}

export interface AirQualityData {
	indice: number;
	label: string;
	pollutants: AirQualityPollutant[];
}

export interface GeorisquesData {
	risks: RiskItem[];
	airQuality: AirQualityData;
	geojson: GeoJSON.FeatureCollection;
}
