"use client";

import MapGL, { Layer, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useMemo, useRef, useState } from "react";
import type { LayerProps, MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useParcellesQuery } from "../../hooks/useParcellesQuery";
import type { Bbox, CadastreFeatureCollection } from "../../types/cadastre";

const EMPTY_CADASTRE_DATA: CadastreFeatureCollection = {
	type: "FeatureCollection",
	features: [],
};

function MapView() {
	const mapRef = useRef<MapRef | null>(null);

	// État pour stocker l'ID de la parcelle survolée
	const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
	const [viewportBbox, setViewportBbox] = useState<Bbox | null>(null);

	const debouncedViewportBbox = useDebouncedValue(viewportBbox, 500);
	const parcellesQuery = useParcellesQuery(debouncedViewportBbox);
	const cadastreData = parcellesQuery.data ?? EMPTY_CADASTRE_DATA;

	const updateViewportBboxFromMap = useCallback(() => {
		if (!mapRef.current) {
			return;
		}

		const bounds = mapRef.current.getBounds();

		if (!bounds) {
			return;
		}

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
		// On cherche si la souris est au-dessus de notre couche transparente de cadastre
		const hoveredFeature = features?.find(
			(feature) => feature.layer?.id === "cadastre-fill",
		);
		const hoveredFeatureId = hoveredFeature?.properties?.id;

		if (hoveredFeatureId !== undefined && hoveredFeatureId !== null) {
			setHoveredParcelId(String(hoveredFeatureId));
		} else {
			setHoveredParcelId(null);
		}
	}, []);

	// Réinitialisation quand la souris quitte la carte
	const onMouseLeave = useCallback(() => {
		setHoveredParcelId(null);
	}, []);

	// Filtre dynamique pour la surbrillance (met en évidence uniquement l'ID survolé)
	const highlightFilter = useMemo(
		() => ["in", "id", hoveredParcelId || ""],
		[hoveredParcelId],
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

	const isLoadingParcelles = parcellesQuery.isFetching;
	const parcellesError = parcellesQuery.error
		? "Impossible de charger les parcelles. Réessayez dans quelques secondes."
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
				interactiveLayerIds={["cadastre-fill"]}
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

				<Source id="cadastre-source" type="geojson" data={cadastreData}>
					{/* 1. Couche de remplissage transparente (pour capter le hover) */}
					<Layer
						id="cadastre-fill"
						type="fill"
						paint={{
							"fill-color": "transparent",
							"fill-outline-color": "transparent",
						}}
					/>

					{/* 2. Couche des contours standards */}
					<Layer
						id="cadastre-line"
						type="line"
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
						filter={highlightFilter}
						paint={{
							"fill-color": "#ef4444",
							"fill-opacity": 0.2, // Remplissage rouge très transparent
						}}
					/>
				</Source>
				{/* --- FIN DE LA SECTION CADASTRE --- */}
			</MapGL>
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
			{(isLoadingParcelles || parcellesError) && (
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
					{isLoadingParcelles && "Chargement des parcelles..."}
					{!isLoadingParcelles && parcellesError}
				</div>
			)}
		</div>
	);
}

export default MapView;
