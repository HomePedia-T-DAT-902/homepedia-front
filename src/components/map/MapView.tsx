"use client";

import MapGL, { Layer, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useMemo, useRef, useState } from "react";
import type { LayerProps, MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useIrisQuery } from "../../hooks/useIrisQuery";
import { useParcellesQuery } from "../../hooks/useParcellesQuery";
import type { Bbox, CadastreFeatureCollection } from "../../types/cadastre";
import type { IrisFeatureCollection } from "../../types/iris";

const EMPTY_CADASTRE_DATA: CadastreFeatureCollection = {
	type: "FeatureCollection",
	features: [],
};

const EMPTY_IRIS_DATA: IrisFeatureCollection = {
	type: "FeatureCollection",
	features: [],
};

const MIN_ZOOM_PARCELLES = 15;
const MIN_ZOOM_IRIS = 11;

function MapView() {
	const mapRef = useRef<MapRef | null>(null);

	// État pour stocker l'ID de la parcelle survolée
	const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
	const [hoveredIrisCode, setHoveredIrisCode] = useState<string | null>(null);
	const [hoveredIrisName, setHoveredIrisName] = useState<string | null>(null);
	const [viewportBbox, setViewportBbox] = useState<Bbox | null>(null);
	const [zoomLevel, setZoomLevel] = useState(15.5);

	const debouncedViewportBbox = useDebouncedValue(viewportBbox, 500);

	const parcellesBbox = zoomLevel >= MIN_ZOOM_PARCELLES ? debouncedViewportBbox : null;
	const parcellesQuery = useParcellesQuery(parcellesBbox);
	const cadastreData = parcellesQuery.data ?? EMPTY_CADASTRE_DATA;

	const irisBbox = zoomLevel >= MIN_ZOOM_IRIS ? debouncedViewportBbox : null;
	const irisQuery = useIrisQuery(irisBbox);
	const irisData = irisQuery.data ?? EMPTY_IRIS_DATA;

	const updateViewportBboxFromMap = useCallback(() => {
		if (!mapRef.current) {
			return;
		}

		const bounds = mapRef.current.getBounds();

		if (!bounds) {
			return;
		}

		setZoomLevel(mapRef.current.getZoom());
		setViewportBbox({
			west: bounds.getWest(),
			south: bounds.getSouth(),
			east: bounds.getEast(),
			north: bounds.getNorth(),
		});
	}, []);

	// Gestionnaire de survol
	const onMouseMove = useCallback((event: MapMouseEvent) => {
		const { features } = event;

		// Cadastre hover
		const hoveredCadastreFeature = features?.find(
			(feature) => feature.layer?.id === "cadastre-fill",
		);
		const hoveredFeatureId = hoveredCadastreFeature?.properties?.id;
		if (hoveredFeatureId !== undefined && hoveredFeatureId !== null) {
			setHoveredParcelId(String(hoveredFeatureId));
		} else {
			setHoveredParcelId(null);
		}

		// IRIS hover
		const hoveredIrisFeature = features?.find(
			(feature) => feature.layer?.id === "iris-fill",
		);
		if (hoveredIrisFeature?.properties) {
			setHoveredIrisCode(String(hoveredIrisFeature.properties.code_iris));
			setHoveredIrisName(String(hoveredIrisFeature.properties.nom_iris));
		} else {
			setHoveredIrisCode(null);
			setHoveredIrisName(null);
		}
	}, []);

	// Réinitialisation quand la souris quitte la carte
	const onMouseLeave = useCallback(() => {
		setHoveredParcelId(null);
		setHoveredIrisCode(null);
		setHoveredIrisName(null);
	}, []);

	// Filtre dynamique pour la surbrillance (met en évidence uniquement l'ID survolé)
	const highlightFilter = useMemo(
		() => ["in", "id", hoveredParcelId || ""],
		[hoveredParcelId],
	);

	const irisHighlightFilter = useMemo(
		() => ["==", ["get", "code_iris"], hoveredIrisCode || ""],
		[hoveredIrisCode],
	);

	const buildingLayer: LayerProps = {
		id: "add-3d-buildings",
		source: "composite",
		"source-layer": "building",
		filter: ["==", "extrude", "true"],
		type: "fill-extrusion",
		minzoom: 15,
		paint: {
			"fill-extrusion-color": "#aaa", // Couleur des bâtiments
			// Utilisation d'une expression pour l'ombre portée et la hauteur
			"fill-extrusion-height": [
				"interpolate",
				["linear"],
				["zoom"],
				15,
				0,
				15.05,
				["get", "height"],
			],
			"fill-extrusion-base": [
				"interpolate",
				["linear"],
				["zoom"],
				15,
				0,
				15.05,
				["get", "min_height"],
			],
			"fill-extrusion-opacity": 0.6,
		},
	};

	const isLoading = parcellesQuery.isFetching || irisQuery.isFetching;
	const loadingMessage = parcellesQuery.isFetching
		? "Chargement des parcelles..."
		: irisQuery.isFetching
			? "Chargement des quartiers IRIS..."
			: null;
	const errorMessage = parcellesQuery.error
		? "Impossible de charger les parcelles. Réessayez dans quelques secondes."
		: irisQuery.error
			? "Impossible de charger les quartiers IRIS."
			: null;

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
			}}
		>
			<MapGL
				ref={mapRef}
				mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
				initialViewState={{
					longitude: -1.201, // Modifié
					latitude: 47.9928, // Modifié
					zoom: 15.5, // Zoom plus proche pour voir les détails
					pitch: 60, // Inclinaison à 60° pour l'effet 3D
					bearing: -20, // Légère rotation pour plus de dynamisme
				}}
				style={{
					width: "100%",
					height: "100%",
					borderRadius: "1.5rem",
				}}
				mapStyle="mapbox://styles/mapbox/navigation-night-v1"
				interactiveLayerIds={["cadastre-fill", "iris-fill"]}
				onLoad={updateViewportBboxFromMap}
				onMove={updateViewportBboxFromMap}
				onMouseMove={onMouseMove}
				onMouseLeave={onMouseLeave}
			>
				{/* Source pour le relief (Terrain) */}
				<Source
					id="mapbox-dem"
					type="raster-dem"
					url="mapbox://mapbox.mapbox-terrain-dem-v1"
					tileSize={512}
					maxzoom={14}
				/>

				{/* Application du terrain */}
				<Layer
					id="terrain-layer"
					type="sky" // Optionnel : ajoute un ciel à l'horizon
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

				{/* Couche de bâtiments 3D */}
				<Layer {...buildingLayer} />

				{/* --- IRIS layers (underneath cadastre) --- */}
				<Source id="iris-source" type="geojson" data={irisData}>
					<Layer
						id="iris-fill"
						type="fill"
						minzoom={10}
						paint={{
							"fill-color": "#10b981",
							"fill-opacity": 0.08,
						}}
					/>
					<Layer
						id="iris-line"
						type="line"
						minzoom={10}
						paint={{
							"line-color": "#94a3b8",
							"line-width": 1.5,
							"line-opacity": 0.5,
						}}
					/>
					<Layer
						id="iris-highlight"
						type="line"
						minzoom={10}
						filter={irisHighlightFilter}
						paint={{
							"line-color": "#10b981",
							"line-width": 3,
							"line-opacity": 1,
						}}
					/>
					<Layer
						id="iris-fill-highlight"
						type="fill"
						minzoom={10}
						filter={irisHighlightFilter}
						paint={{
							"fill-color": "#10b981",
							"fill-opacity": 0.25,
						}}
					/>
				</Source>

				<Source id="cadastre-source" type="geojson" data={cadastreData}>
					{/* 1. Couche de remplissage transparente (pour capter le hover) */}
					<Layer
						id="cadastre-fill"
						type="fill"
						minzoom={MIN_ZOOM_PARCELLES}
						paint={{
							"fill-color": "transparent",
							"fill-outline-color": "transparent",
						}}
					/>

					{/* 2. Couche des contours standards */}
					<Layer
						id="cadastre-line"
						type="line"
						minzoom={MIN_ZOOM_PARCELLES}
						paint={{
							"line-color": "#eab308", // Jaune moutarde, bien visible sur le thème nuit
							"line-width": 1.5,
							"line-opacity": 0.7,
						}}
					/>

					{/* 3. Couche de mise en évidence au survol */}
					<Layer
						id="cadastre-highlight"
						type="line"
						minzoom={MIN_ZOOM_PARCELLES}
						filter={highlightFilter}
						paint={{
							"line-color": "#ef4444", // Rouge vif pour le hover
							"line-width": 4,
							"line-opacity": 1,
						}}
					/>

					{/* Optionnel : Légère surbrillance du fond au survol */}
					<Layer
						id="cadastre-fill-highlight"
						type="fill"
						minzoom={MIN_ZOOM_PARCELLES}
						filter={highlightFilter}
						paint={{
							"fill-color": "#ef4444",
							"fill-opacity": 0.2, // Remplissage rouge très transparent
						}}
					/>
				</Source>
				{/* --- FIN DE LA SECTION CADASTRE --- */}
			</MapGL>
			{/* Tooltip parcelle */}
			{hoveredParcelId && (
				<div
					style={{
						position: "absolute",
						top: 20,
						left: 20,
						padding: "8px 16px",
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						color: "white",
						borderRadius: "8px",
						fontWeight: "bold",
						pointerEvents: "none",
					}}
				>
					Parcelle survolée : {hoveredParcelId}
				</div>
			)}
			{/* Tooltip IRIS */}
			{hoveredIrisName && !hoveredParcelId && (
				<div
					style={{
						position: "absolute",
						top: 20,
						left: 20,
						padding: "8px 16px",
						backgroundColor: "rgba(0, 0, 0, 0.8)",
						color: "#10b981",
						borderRadius: "8px",
						fontWeight: "bold",
						pointerEvents: "none",
					}}
				>
					IRIS : {hoveredIrisName}
				</div>
			)}
			{(isLoading || errorMessage) && (
				<div
					style={{
						position: "absolute",
						right: 20,
						bottom: 20,
						padding: "10px 14px",
						borderRadius: "10px",
						backgroundColor: "rgba(15, 23, 42, 0.85)",
						color: "#e2e8f0",
						fontSize: "0.875rem",
						fontWeight: 600,
						pointerEvents: "none",
						maxWidth: "320px",
						border: "1px solid rgba(148, 163, 184, 0.35)",
					}}
				>
					{isLoading && loadingMessage}
					{!isLoading && errorMessage}
				</div>
			)}
		</div>
	);
}

export default MapView;
