"use client";

import type { TargetFeature } from "mapbox-gl";
import MapGL, { Layer, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Car, Loader2, PersonStanding } from "lucide-react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import type { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import type { Address } from "../../types/address";
import type { IsochroneData } from "../../types/isochrone";
import type { Poi } from "../../types/poi";
import type {
	PrixColumnFeatureCollection,
	PrixHeatFeatureCollection,
} from "../../types/prix";
import {
	RISK_TYPE_LABEL,
	type RiskPointFeatureCollection,
	type RiskPointType,
} from "../../types/risques";
import type { RouteDurations } from "../../types/route";
import {
	CATEGORY_ICON,
	type CategoryId,
	type PrixViewMode,
} from "../categories";

// Prix / m² : dégradé vert (bon marché) → ambre → rouge (cher).
const PRIX_COLOR_LOW = "#22c55e";
const PRIX_COLOR_MID = "#f59e0b";
const PRIX_COLOR_HIGH = "#ef4444";

const RISK_POINT_COLOR: Record<RiskPointType, string> = {
	icpe: "#f97316",
	cavite: "#a855f7",
	mouvement_terrain: "#eab308",
	inondation: "#0ea5e9",
	seisme: "#ef4444",
	retrait_gonflement_argile: "#92400e",
	feu_foret: "#f43f5e",
	radon: "#14b8a6",
};

function formatDuration(seconds: number | null | undefined): string {
	if (seconds == null) return "—";
	const min = Math.round(seconds / 60);
	return min < 1 ? "< 1 min" : `${min} min`;
}

export interface MapViewHandle {
	/** Re-centers the camera on the current address. */
	recenter: () => void;
}

interface MapViewProps {
	selectedAddress: Address | null;
	activeCategory: CategoryId | null;
	pois?: Poi[];
	poiDurations?: Record<string, RouteDurations>;
	selectedPoiId: string | null;
	onPoiSelect: (poi: Poi) => void;
	routeData: GeoJSON.FeatureCollection | null;
	isochroneData?: IsochroneData;
	riskPointsGeoJson?: RiskPointFeatureCollection;
	prixColumnsGeoJson?: PrixColumnFeatureCollection;
	prixHeatmapGeoJson?: PrixHeatFeatureCollection;
	prixViewMode?: PrixViewMode;
	prixMinPrice?: number;
	prixMaxPrice?: number;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
	{
		selectedAddress,
		activeCategory,
		pois,
		poiDurations,
		selectedPoiId,
		onPoiSelect,
		routeData,
		isochroneData,
		riskPointsGeoJson,
		prixColumnsGeoJson,
		prixHeatmapGeoJson,
		prixViewMode = "points",
		prixMinPrice = 0,
		prixMaxPrice = 0,
	}: MapViewProps,
	ref,
) {
	const mapRef = useRef<MapRef | null>(null);

	const [isMapLoaded, setIsMapLoaded] = useState(false);
	// Stays false until the Standard style's basemap import has finished
	// loading. Adding layers/sources before that throws "Style is not done
	// loading" (map.style._loaded can be true before imports are ready).
	const [isStyleReady, setIsStyleReady] = useState(false);
	// Stays false until the dusk style is fully rendered, to hide the flash
	const [isMapReady, setIsMapReady] = useState(false);
	const [mapError, setMapError] = useState<string | null>(null);
	const [hoveredFeature, setHoveredFeature] = useState<{
		label: string;
		detail: string | null;
	} | null>(null);
	const priceDomainMax =
		prixMaxPrice > prixMinPrice ? prixMaxPrice : prixMinPrice + 1;
	const priceDomainMid = (prixMinPrice + priceDomainMax) / 2;
	const selectedBuildingRef = useRef<TargetFeature | null>(null);

	const CategoryIcon = activeCategory ? CATEGORY_ICON[activeCategory] : null;
	const hasPois = pois && pois.length > 0;

	const onMapLoad = useCallback(() => {
		setIsMapLoaded(true);
		const map = mapRef.current?.getMap();
		if (!map) return;
		map.setConfigProperty("basemap", "lightPreset", "dusk");
		map.setConfigProperty("basemap", "colorBuildingSelect", "#3b82f6");

		let styleReady = false;
		const markStyleReady = () => {
			if (!styleReady) {
				styleReady = true;
				setIsStyleReady(true);
			}
		};
		if (map.isStyleLoaded()) {
			markStyleReady();
		} else {
			map.once("style.import.load", markStyleReady);
			// Safety fallback in case the import event was missed or doesn't fire
			map.once("idle", markStyleReady);
		}

		// Reveal map once dusk has fully rendered; timeout is a safety fallback
		let revealed = false;
		const reveal = () => {
			if (!revealed) {
				revealed = true;
				setIsMapReady(true);
			}
		};
		map.once("idle", reveal);
		setTimeout(reveal, 1500);
	}, []);

	const onMapError = useCallback(() => {
		setMapError(
			"Impossible de charger la carte. Vérifiez votre connexion et rechargez la page.",
		);
	}, []);

	const onMouseMove = useCallback((event: MapMouseEvent) => {
		const feature = event.features?.find(
			(f) => f.layer?.id === "risk-points" || f.layer?.id === "prix-columns",
		);
		if (!feature?.properties) {
			setHoveredFeature(null);
			return;
		}

		if (feature.layer?.id === "risk-points") {
			setHoveredFeature({
				label: String(feature.properties.label),
				detail: null,
			});
		} else {
			const { prixM2Moyen, nbTransactions } = feature.properties;
			setHoveredFeature({
				label: `${Math.round(prixM2Moyen).toLocaleString("fr-FR")} €/m²`,
				detail: `${nbTransactions} transaction${nbTransactions > 1 ? "s" : ""}`,
			});
		}
	}, []);

	const onMouseLeave = useCallback(() => {
		setHoveredFeature(null);
	}, []);

	const flyToBuilding = useCallback(() => {
		if (!selectedAddress || !isMapLoaded || !mapRef.current) return;

		const map = mapRef.current.getMap();
		const [lng, lat] = selectedAddress.coordinates;

		if (selectedBuildingRef.current) {
			map.setFeatureState(selectedBuildingRef.current, { select: false });
			selectedBuildingRef.current = null;
		}

		map.flyTo({
			center: [lng, lat],
			zoom: 17,
			pitch: 60,
			bearing: -20,
			duration: 1400,
		});

		// Wait for animation to finish (moveend), then for tiles to render (idle)
		map.once("moveend", () => {
			if (!mapRef.current) return;
			map.once("idle", () => {
				if (!mapRef.current) return;
				const point = map.project([lng, lat]);

				let features = map.queryRenderedFeatures(point, {
					target: { featuresetId: "buildings", importId: "basemap" },
				});
				if (features.length === 0) {
					features = map.queryRenderedFeatures(
						[
							[point.x - 40, point.y - 40],
							[point.x + 40, point.y + 40],
						],
						{ target: { featuresetId: "buildings", importId: "basemap" } },
					);
				}

				if (features.length > 0) {
					selectedBuildingRef.current = features[0] as TargetFeature;
					map.setFeatureState(features[0], { select: true });
				}
			});
		});
	}, [selectedAddress, isMapLoaded]);

	// Le rayon ne sert qu'à délimiter le périmètre des données affichées
	// (POI, risques, prix) — il ne doit jamais faire bouger la caméra. Seule
	// l'adresse sélectionnée pilote le cadrage.
	useEffect(() => {
		flyToBuilding();
	}, [flyToBuilding]);

	useImperativeHandle(
		ref,
		() => ({
			recenter: flyToBuilding,
		}),
		[flyToBuilding],
	);

	return (
		<div
			style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
		>
			<MapGL
				ref={mapRef}
				mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
				initialViewState={{
					longitude: -1.6778,
					latitude: 48.1117,
					zoom: 15.5,
					pitch: 60,
					bearing: -20,
				}}
				style={{ width: "100%", height: "100%" }}
				mapStyle="mapbox://styles/mapbox/standard"
				interactiveLayerIds={["risk-points", "prix-columns"]}
				onLoad={onMapLoad}
				onError={onMapError}
				onMouseMove={onMouseMove}
				onMouseLeave={onMouseLeave}
			>
				{/* Layers/sources below need the Standard style's basemap import to
            be fully loaded — mounting them earlier throws "Style is not
            done loading" (mapbox-gl race with style imports). */}
				{isStyleReady && (
					<>
						{/* Sky layer */}
						<Layer
							id="terrain-layer"
							type="sky"
							paint={{
								"sky-type": "gradient",
								"sky-gradient": [
									"interpolate",
									["linear"],
									["sky-radial-progress"],
									0.8,
									"rgba(0,0,0,0)",
									1,
									"rgba(0,0,0,0.5)",
								],
							}}
						/>

						{/* Route */}
						{routeData && (
							<Source id="route-source" type="geojson" data={routeData}>
								<Layer
									id="route-line-glow"
									slot="middle"
									type="line"
									layout={{ "line-join": "round", "line-cap": "round" }}
									paint={{
										"line-color": "#38bdf8",
										"line-width": 16,
										"line-opacity": 0.4,
										"line-blur": 6,
										"line-emissive-strength": 1,
										"line-occlusion-opacity": 0.15,
									}}
								/>
								<Layer
									id="route-line-bg"
									slot="middle"
									type="line"
									layout={{ "line-join": "round", "line-cap": "round" }}
									paint={{
										"line-color": "#38bdf8",
										"line-width": 7,
										"line-opacity": 0.5,
										"line-emissive-strength": 1,
										"line-occlusion-opacity": 0.25,
									}}
								/>
								<Layer
									id="route-line"
									slot="middle"
									type="line"
									layout={{ "line-join": "round", "line-cap": "round" }}
									paint={{
										"line-color": "#fff",
										"line-width": 2,
										"line-opacity": 1,
										"line-emissive-strength": 1,
										"line-occlusion-opacity": 0.35,
									}}
								/>
							</Source>
						)}

						{/* Isochrone overlay — slot "middle" pour passer sous les bâtiments 3D */}
						{isochroneData && (
							<Source
								id="isochrone-source"
								type="geojson"
								data={isochroneData.geojson}
							>
								<Layer
									id="isochrone-fill"
									type="fill"
									slot="middle"
									paint={{
										"fill-color": [
											"match",
											["get", "contour"],
											5,
											"rgba(34,211,238,0.6)",
											10,
											"rgba(34,211,238,0.4)",
											15,
											"rgba(34,211,238,0.2)",
											"rgba(34,211,238,0.1)",
										],
										"fill-emissive-strength": 1,
									}}
								/>
								<Layer
									id="isochrone-line"
									type="line"
									slot="middle"
									paint={{
										"line-color": "#22d3ee",
										"line-width": 4,
										"line-opacity": [
											"match",
											["get", "contour"],
											5,
											1,
											10,
											0.8,
											15,
											0.6,
											0.4,
										],
										"line-emissive-strength": 1,
									}}
								/>
							</Source>
						)}

						{/* Risk points (ICPE / cavités / mouvements de terrain / risques zonaux) — backend risques.geopoints */}
						{riskPointsGeoJson && (
							<Source
								id="risk-points-source"
								type="geojson"
								data={riskPointsGeoJson}
							>
								<Layer
									id="risk-points"
									type="circle"
									slot="middle"
									paint={{
										"circle-radius": 6,
										"circle-color": [
											"match",
											["get", "riskType"],
											"icpe",
											RISK_POINT_COLOR.icpe,
											"cavite",
											RISK_POINT_COLOR.cavite,
											"mouvement_terrain",
											RISK_POINT_COLOR.mouvement_terrain,
											"inondation",
											RISK_POINT_COLOR.inondation,
											"seisme",
											RISK_POINT_COLOR.seisme,
											"retrait_gonflement_argile",
											RISK_POINT_COLOR.retrait_gonflement_argile,
											"feu_foret",
											RISK_POINT_COLOR.feu_foret,
											"radon",
											RISK_POINT_COLOR.radon,
											"#94a3b8",
										],
										"circle-stroke-width": 2,
										"circle-stroke-color": "#0f172a",
										"circle-opacity": 0.9,
										"circle-emissive-strength": 1,
									}}
								/>
							</Source>
						)}

						{/* Prix DVF — vue points (colonne 3D par coordonnée, hauteur = nb transactions, couleur = prix/m² moyen) */}
						{prixViewMode === "points" && prixColumnsGeoJson && (
							<Source
								id="prix-columns-source"
								type="geojson"
								data={prixColumnsGeoJson}
							>
								<Layer
									id="prix-columns"
									type="fill-extrusion"
									slot="top"
									paint={{
										"fill-extrusion-height": [
											"interpolate",
											["linear"],
											["get", "nbTransactions"],
											1,
											30,
											5,
											120,
											20,
											400,
										],
										"fill-extrusion-base": 0,
										"fill-extrusion-color": [
											"interpolate",
											["linear"],
											["get", "prixM2Moyen"],
											prixMinPrice,
											PRIX_COLOR_LOW,
											priceDomainMid,
											PRIX_COLOR_MID,
											priceDomainMax,
											PRIX_COLOR_HIGH,
										],
										"fill-extrusion-opacity": 0.95,
										"fill-extrusion-emissive-strength": 1,
										"fill-extrusion-vertical-gradient": false,
									}}
								/>
							</Source>
						)}

						{/* Prix DVF — vue fondu (heatmap natif Mapbox, mélange lisse au lieu de cellules carrées) */}
						{prixViewMode === "choropleth" && prixHeatmapGeoJson && (
							<Source
								id="prix-heatmap-source"
								type="geojson"
								data={prixHeatmapGeoJson}
							>
								<Layer
									id="prix-heatmap"
									type="heatmap"
									slot="middle"
									paint={{
										"heatmap-weight": [
											"interpolate",
											["linear"],
											["get", "prixM2Moyen"],
											prixMinPrice,
											0,
											priceDomainMax,
											1,
										],
										"heatmap-intensity": [
											"interpolate",
											["linear"],
											["zoom"],
											11,
											0.15,
											16,
											0.5,
										],
										"heatmap-radius": [
											"interpolate",
											["linear"],
											["zoom"],
											11,
											12,
											16,
											28,
										],
										"heatmap-color": [
											"interpolate",
											["linear"],
											["heatmap-density"],
											0,
											"rgba(0,0,0,0)",
											0.3,
											PRIX_COLOR_LOW,
											0.65,
											PRIX_COLOR_MID,
											1,
											PRIX_COLOR_HIGH,
										],
										"heatmap-opacity": 0.75,
									}}
								/>
							</Source>
						)}
					</>
				)}

				{/* POI pastilles: category icon, name, walking & driving durations */}
				{hasPois &&
					CategoryIcon &&
					pois.map((poi) => {
						const isSelected = poi.id === selectedPoiId;
						const durations = poiDurations?.[poi.id];
						return (
							<Marker
								key={poi.id}
								longitude={poi.coordinates[0]}
								latitude={poi.coordinates[1]}
								anchor="bottom"
								onClick={() => onPoiSelect(poi)}
							>
								<button
									type="button"
									className={`flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1.5 shadow-lg border border-white/10 cursor-pointer transition-all glass ${
										isSelected ? "ring-2 ring-white/25" : ""
									}`}
								>
									<span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-accent text-white">
										<CategoryIcon size={13} />
									</span>
									<span className="flex flex-col items-start leading-tight">
										<span className="text-[11px] font-medium text-white max-w-30 truncate">
											{poi.name}
										</span>
										<span className="flex items-center gap-2 text-[10px] text-slate-400">
											<span className="flex items-center gap-0.5">
												<PersonStanding size={10} />
												{formatDuration(durations?.walkingSec)}
											</span>
											<span className="flex items-center gap-0.5">
												<Car size={10} />
												{formatDuration(durations?.drivingSec)}
											</span>
										</span>
									</span>
								</button>
							</Marker>
						);
					})}
			</MapGL>

			{/* Dark overlay that fades once the dusk style is fully rendered — shows a
			    spinner so the initial load (which can take a few seconds) isn't a
			    blank screen. */}
			<div
				className="absolute inset-0 bg-slate-950 pointer-events-none transition-opacity duration-700 flex items-center justify-center"
				style={{ opacity: isMapReady ? 0 : 1, zIndex: 5 }}
			>
				{!mapError && <Loader2 className="animate-spin text-slate-500" size={32} />}
			</div>

			{/* Error overlay */}
			{mapError && (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 gap-4">
					<p className="text-slate-300 text-sm text-center px-6">{mapError}</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium cursor-pointer"
					>
						Recharger
					</button>
				</div>
			)}

			{/* Tooltip survol (points de risque / prix) */}
			{hoveredFeature && (
				<div
					style={{
						position: "absolute",
						top: 20,
						left: 20,
						padding: "8px 16px",
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						color: "white",
						borderRadius: "8px",
						pointerEvents: "none",
						maxWidth: "280px",
						zIndex: 2,
					}}
				>
					<div style={{ fontWeight: "bold" }}>{hoveredFeature.label}</div>
					{hoveredFeature.detail && (
						<div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
							{hoveredFeature.detail}
						</div>
					)}
				</div>
			)}

			{/* Légende points de risque */}
			{riskPointsGeoJson && riskPointsGeoJson.features.length > 0 && (
				<div
					style={{
						position: "absolute",
						left: 20,
						bottom: 20,
						padding: "10px 14px",
						borderRadius: "10px",
						backgroundColor: "rgba(15, 23, 42, 0.85)",
						border: "1px solid rgba(148, 163, 184, 0.35)",
						display: "flex",
						flexDirection: "column",
						gap: 6,
						pointerEvents: "none",
						zIndex: 2,
					}}
				>
					{(
						Object.keys(RISK_TYPE_LABEL) as (keyof typeof RISK_TYPE_LABEL)[]
					).map((type) => (
						<div
							key={type}
							style={{ display: "flex", alignItems: "center", gap: 8 }}
						>
							<span
								style={{
									width: 10,
									height: 10,
									borderRadius: "50%",
									backgroundColor: RISK_POINT_COLOR[type],
									flexShrink: 0,
								}}
							/>
							<span style={{ fontSize: "0.75rem", color: "#e2e8f0" }}>
								{RISK_TYPE_LABEL[type]}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
});

export default MapView;
