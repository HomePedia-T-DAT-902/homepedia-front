export interface CommuneRisques {
	code_commune: string;
	inondation: boolean | null;
	seisme: boolean | null;
	mouvement_terrain: boolean | null;
	retrait_gonflement_argile: boolean | null;
	radon: boolean | null;
	feu_foret: boolean | null;
	icpe: boolean | null;
	source_annee: number | null;
}

export type RiskPointType =
	| "icpe"
	| "cavite"
	| "mouvement_terrain"
	| "inondation"
	| "seisme"
	| "retrait_gonflement_argile"
	| "feu_foret"
	| "radon";

export interface RisqueGeopoint {
	id: number;
	type_risque: RiskPointType;
	longitude: number;
	latitude: number;
	code_commune: string | null;
}

export const RISK_TYPE_LABEL: Record<RiskPointType, string> = {
	icpe: "Installation classée (ICPE)",
	cavite: "Cavité souterraine",
	mouvement_terrain: "Mouvement de terrain",
	inondation: "Zone inondable",
	seisme: "Zone sismique",
	retrait_gonflement_argile: "Retrait-gonflement des argiles",
	feu_foret: "Feu de forêt",
	radon: "Radon",
};

export interface RiskPointProperties {
	riskType: RiskPointType;
	label: string;
}

export type RiskPointFeatureCollection = GeoJSON.FeatureCollection<
	GeoJSON.Point,
	RiskPointProperties
>;
