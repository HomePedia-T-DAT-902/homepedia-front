import { useQuery } from "@tanstack/react-query";
import type { GeorisquesData, RiskLevel } from "../types/georisques";

const RISK_RADII: Record<string, number> = {
	Inondation: 1_200,
	"Mouvement de terrain": 600,
	Séisme: 900,
	Radon: 300,
	"Risque industriel (ICPE)": 750,
	"Transport de matières dangereuses": 450,
};

type ActiveLevel = Exclude<RiskLevel, "Nul">;

const RISK_RGB: Record<ActiveLevel, string> = {
	Faible: "34,197,94",
	Modéré: "245,158,11",
	Fort: "239,68,68",
	"Très fort": "220,38,38",
};

// [outer band, middle band, inner fill]
const BAND_OPACITIES: Record<ActiveLevel, [number, number, number]> = {
	Faible: [0.12, 0.25, 0.42],
	Modéré: [0.18, 0.35, 0.55],
	Fort: [0.22, 0.45, 0.65],
	"Très fort": [0.28, 0.52, 0.72],
};

function seededNoise(seed: number): number {
	const x = Math.sin(seed) * 43758.5453123;
	return x - Math.floor(x);
}

function organicCoords(
	lng: number,
	lat: number,
	radiusM: number,
	steps = 48,
	jitter = 0.18,
	seedOffset = 0,
): [number, number][] {
	const latRad = lat * (Math.PI / 180);
	const dlat = radiusM / 111_000;
	const dlng = radiusM / (111_000 * Math.cos(latRad));

	const pts: [number, number][] = Array.from({ length: steps }, (_, i) => {
		const a = (i / steps) * 2 * Math.PI;
		const n = seededNoise(i * 7.3 + seedOffset + lng * 17.3 + lat * 31.1);
		const factor = 1 + (n - 0.5) * 2 * jitter;
		return [
			lng + dlng * Math.cos(a) * factor,
			lat + dlat * Math.sin(a) * factor,
		];
	});

	pts.push(pts[0]);
	return pts;
}

function makeRiskFeatures(
	lng: number,
	lat: number,
	radiusM: number,
	label: string,
	niveau: ActiveLevel,
): GeoJSON.Feature<GeoJSON.Polygon>[] {
	const rgb = RISK_RGB[niveau];
	const [outerOp, midOp, innerOp] = BAND_OPACITIES[niveau];
	const noLine = "rgba(0,0,0,0)";

	const seed = lng * 100 + lat * 200;

	// Jitter decreases toward center so inner rings stay inside outer rings
	const r100 = organicCoords(lng, lat, radiusM, 48, 0.18, seed);
	const r65 = organicCoords(lng, lat, radiusM * 0.65, 48, 0.13, seed + 100);
	const r30 = organicCoords(lng, lat, radiusM * 0.3, 48, 0.1, seed + 200);

	return [
		// Outer band (donut r65 → r100)
		{
			type: "Feature",
			properties: {
				label,
				niveau,
				fillColor: `rgba(${rgb},${outerOp})`,
				lineColor: noLine,
			},
			geometry: { type: "Polygon", coordinates: [r100, [...r65].reverse()] },
		},
		// Middle band (donut r30 → r65)
		{
			type: "Feature",
			properties: {
				label,
				niveau,
				fillColor: `rgba(${rgb},${midOp})`,
				lineColor: noLine,
			},
			geometry: { type: "Polygon", coordinates: [r65, [...r30].reverse()] },
		},
		// Inner fill
		{
			type: "Feature",
			properties: {
				label,
				niveau,
				fillColor: `rgba(${rgb},${innerOp})`,
				lineColor: noLine,
			},
			geometry: { type: "Polygon", coordinates: [r30] },
		},
	];
}

const MOCK_RISKS = [
	{ libelle: "Inondation", niveau: "Faible" as RiskLevel },
	{ libelle: "Mouvement de terrain", niveau: "Nul" as RiskLevel },
	{ libelle: "Séisme", niveau: "Faible" as RiskLevel },
	{ libelle: "Radon", niveau: "Modéré" as RiskLevel },
	{ libelle: "Risque industriel (ICPE)", niveau: "Nul" as RiskLevel },
	{
		libelle: "Transport de matières dangereuses",
		niveau: "Faible" as RiskLevel,
	},
];

const MOCK_AIR_QUALITY = {
	indice: 38,
	label: "Bonne qualité de l'air",
	pollutants: [
		{ name: "NO₂", value: 18, max: 40, unit: "µg/m³" },
		{ name: "PM2.5", value: 8, max: 25, unit: "µg/m³" },
		{ name: "O₃", value: 62, max: 120, unit: "µg/m³" },
		{ name: "PM10", value: 15, max: 50, unit: "µg/m³" },
	],
};

function buildMockGeorisques(coordinates: [number, number]): GeorisquesData {
	const [lng, lat] = coordinates;

	const features = MOCK_RISKS.filter((r) => r.niveau !== "Nul").flatMap((r) =>
		makeRiskFeatures(
			lng,
			lat,
			RISK_RADII[r.libelle] ?? 500,
			r.libelle,
			r.niveau as ActiveLevel,
		),
	);

	return {
		risks: MOCK_RISKS,
		airQuality: MOCK_AIR_QUALITY,
		geojson: { type: "FeatureCollection", features },
	};
}

export function useGeorisquesQuery(coordinates: [number, number] | null) {
	return useQuery({
		queryKey: [
			"georisques",
			coordinates?.[0]?.toFixed(4),
			coordinates?.[1]?.toFixed(4),
		],
		queryFn: (): Promise<GeorisquesData> =>
			new Promise((resolve) =>
				setTimeout(() => resolve(buildMockGeorisques(coordinates!)), 600),
			),
		enabled: coordinates !== null,
		staleTime: 60 * 60_000,
		gcTime: 60 * 60_000,
	});
}
