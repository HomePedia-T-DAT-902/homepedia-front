"use client";

import MapGL, { Layer, NavigationControl, Source } from "react-map-gl/mapbox";
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

	const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
	const [hoveredIrisCode, setHoveredIrisCode] = useState<string | null>(null);
	const [hoveredIrisName, setHoveredIrisName] = useState<string | null>(null);
	const [viewportBbox, setViewportBbox] = useState<Bbox | null>(null);
	const [zoomLevel, setZoomLevel] = useState(15.5);
	const [is3D, setIs3D] = useState(false);
	const hoveredBuildingIds = useRef<{ id: number; source: string; sourceLayer: string }[]>([]);

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

	const clearHoveredBuildings = useCallback(() => {
		const map = mapRef.current;
		if (!map) return;
		for (const b of hoveredBuildingIds.current) {
			map.setFeatureState(
				{ source: b.source, sourceLayer: b.sourceLayer, id: b.id },
				{ hover: false },
			);
		}
		hoveredBuildingIds.current = [];
	}, []);

	const onMouseMove = useCallback(
		(event: MapMouseEvent) => {
			const map = mapRef.current;
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

			// Buildings hover (3D mode)
			clearHoveredBuildings();
			if (map && is3D && map.getLayer("3d-buildings")) {
				const buildings = map.queryRenderedFeatures(event.point, {
					layers: ["3d-buildings"],
				});
				for (const b of buildings) {
					if (b.id != null && b.source && b.sourceLayer) {
						const entry = {
							id: b.id as number,
							source: b.source,
							sourceLayer: b.sourceLayer,
						};
						map.setFeatureState(
							{ source: entry.source, sourceLayer: entry.sourceLayer, id: entry.id },
							{ hover: true },
						);
						hoveredBuildingIds.current.push(entry);
					}
				}
			}
		},
		[is3D, clearHoveredBuildings],
	);

	const onMouseLeave = useCallback(() => {
		setHoveredParcelId(null);
		setHoveredIrisCode(null);
		setHoveredIrisName(null);
		clearHoveredBuildings();
	}, [clearHoveredBuildings]);

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
		id: "3d-buildings",
		source: "composite",
		"source-layer": "building",
		filter: ["==", "extrude", "true"],
		type: "fill-extrusion",
		minzoom: 15,
		paint: {
			"fill-extrusion-color": [
				"case",
				["boolean", ["feature-state", "hover"], false],
				"#ef4444",
				"#aaa",
			],
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
			"fill-extrusion-opacity": 0.7,
		},
	};

	const toggle3D = useCallback(() => {
		const map = mapRef.current;
		if (!map) return;
		setIs3D((prev) => {
			const next = !prev;
			map.easeTo({
				pitch: next ? 60 : 0,
				bearing: next ? -20 : 0,
				duration: 500,
			});
			return next;
		});
	}, []);

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
					longitude: -1.201,
					latitude: 47.9928,
					zoom: 15.5,
					pitch: 0,
					bearing: 0,
				}}
				style={{
					width: "100%",
					height: "100%",
					borderRadius: "1.5rem",
				}}
				mapStyle="mapbox://styles/mapbox/streets-v12"
				interactiveLayerIds={["cadastre-fill", "iris-fill"]}
				onLoad={updateViewportBboxFromMap}
				onMove={updateViewportBboxFromMap}
				onMouseMove={onMouseMove}
				onMouseLeave={onMouseLeave}
			>
				<NavigationControl position="top-right" showCompass={false} />

				{is3D && <Layer {...buildingLayer} />}

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

					<Layer
						id="cadastre-fill-highlight"
						type="fill"
						minzoom={MIN_ZOOM_PARCELLES}
						filter={highlightFilter}
						paint={{
							"fill-color": "#ef4444",
							"fill-opacity": 0.2,
						}}
					/>
				</Source>
				{/* --- FIN DE LA SECTION CADASTRE --- */}
			</MapGL>
			{/* Bouton 3D */}
			<button
				type="button"
				onClick={toggle3D}
				style={{
					position: "absolute",
					top: 80,
					right: 10,
					width: 29,
					height: 29,
					border: "none",
					borderRadius: 4,
					backgroundColor: is3D ? "#4f46e5" : "#fff",
					color: is3D ? "#fff" : "#333",
					fontSize: 12,
					fontWeight: 700,
					cursor: "pointer",
					boxShadow: "0 0 0 2px rgba(0,0,0,0.1)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
				title={is3D ? "Passer en 2D" : "Passer en 3D"}
			>
				3D
			</button>
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
