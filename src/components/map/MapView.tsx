"use client";

import type { TargetFeature } from "mapbox-gl";
import MapGL, { Layer, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Car, PersonStanding } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useIrisQuery } from "../../hooks/useIrisQuery";
import { useParcellesQuery } from "../../hooks/useParcellesQuery";
import type { Address } from "../../types/address";
import type { Bbox, CadastreFeatureCollection } from "../../types/cadastre";
import type { IrisFeatureCollection } from "../../types/iris";
import type { IsochroneData } from "../../types/isochrone";
import type { Poi } from "../../types/poi";
import type { RouteDurations } from "../../types/route";
import { CATEGORY_ICON, type CategoryId } from "../FloatingPanel";

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

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const min = Math.round(seconds / 60);
  return min < 1 ? "< 1 min" : `${min} min`;
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
  risksGeoJson?: GeoJSON.FeatureCollection;
  activeRisks?: string[] | null;
}

function MapView({
  selectedAddress,
  activeCategory,
  pois,
  poiDurations,
  selectedPoiId,
  onPoiSelect,
  routeData,
  isochroneData,
  risksGeoJson,
  activeRisks,
}: MapViewProps) {
  const mapRef = useRef<MapRef | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // Stays false until the dusk style is fully rendered, to hide the flash
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
  const [hoveredIrisCode, setHoveredIrisCode] = useState<string | null>(null);
  const [hoveredIrisName, setHoveredIrisName] = useState<string | null>(null);
  const selectedBuildingRef = useRef<TargetFeature | null>(null);
  const [viewportBbox, setViewportBbox] = useState<Bbox | null>(null);
  const [zoomLevel, setZoomLevel] = useState(15.5);

  const debouncedViewportBbox = useDebouncedValue(viewportBbox, 500);

  const parcellesBbox =
    zoomLevel >= MIN_ZOOM_PARCELLES ? debouncedViewportBbox : null;
  const parcellesQuery = useParcellesQuery(parcellesBbox);
  const cadastreData = parcellesQuery.data ?? EMPTY_CADASTRE_DATA;

  const irisBbox = zoomLevel >= MIN_ZOOM_IRIS ? debouncedViewportBbox : null;
  const irisQuery = useIrisQuery(irisBbox);
  const irisData = irisQuery.data ?? EMPTY_IRIS_DATA;

  const CategoryIcon = activeCategory ? CATEGORY_ICON[activeCategory] : null;
  const hasPois = pois && pois.length > 0;

  const updateViewportBboxFromMap = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    setZoomLevel(mapRef.current.getZoom());
    setViewportBbox({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    });
  }, []);

  const onMapLoad = useCallback(() => {
    updateViewportBboxFromMap();
    setIsMapLoaded(true);
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.setConfigProperty("basemap", "lightPreset", "dusk");
    map.setConfigProperty("basemap", "colorBuildingSelect", "#3b82f6");
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
  }, [updateViewportBboxFromMap]);

  const onMapError = useCallback(() => {
    setMapError(
      "Impossible de charger la carte. Vérifiez votre connexion et rechargez la page.",
    );
  }, []);

  // Gestionnaire de survol
  const onMouseMove = useCallback((event: MapMouseEvent) => {
    const { features } = event;

    // Cadastre hover
    const hoveredCadastreFeature = features?.find(
      (feature) => feature.layer?.id === "cadastre-fill",
    );
    const hoveredFeatureId = hoveredCadastreFeature?.properties?.id;
    setHoveredParcelId(
      hoveredFeatureId != null ? String(hoveredFeatureId) : null,
    );

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

  const highlightFilter = useMemo(
    () => ["in", "id", hoveredParcelId || ""],
    [hoveredParcelId],
  );

  const irisHighlightFilter = useMemo(
    () => ["==", ["get", "code_iris"], hoveredIrisCode || ""],
    [hoveredIrisCode],
  );

  const interactiveLayerIds = useMemo(() => ["cadastre-fill", "iris-fill"], []);

  useEffect(() => {
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

  const filteredRisksGeoJson = useMemo(():
    | GeoJSON.FeatureCollection
    | undefined => {
    if (!risksGeoJson) return undefined;
    if (!activeRisks) return risksGeoJson;
    return {
      ...risksGeoJson,
      features: risksGeoJson.features.filter(
        (f) =>
          f.properties && activeRisks.includes(f.properties.label as string),
      ),
    };
  }, [risksGeoJson, activeRisks]);

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
        interactiveLayerIds={interactiveLayerIds}
        onLoad={onMapLoad}
        onError={onMapError}
        onMove={updateViewportBboxFromMap}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
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

        {/* --- IRIS layers (underneath cadastre) --- */}
        <Source id="iris-source" type="geojson" data={irisData}>
          <Layer
            id="iris-fill"
            type="fill"
            minzoom={MIN_ZOOM_IRIS}
            paint={{
              "fill-color": "#10b981",
              "fill-opacity": 0.08,
            }}
          />
          <Layer
            id="iris-line"
            type="line"
            minzoom={MIN_ZOOM_IRIS}
            paint={{
              "line-color": "#94a3b8",
              "line-width": 1.5,
              "line-opacity": 0.5,
            }}
          />
          <Layer
            id="iris-highlight"
            type="line"
            minzoom={MIN_ZOOM_IRIS}
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
            minzoom={MIN_ZOOM_IRIS}
            filter={irisHighlightFilter}
            paint={{
              "fill-color": "#10b981",
              "fill-opacity": 0.25,
            }}
          />
        </Source>

        {/* Cadastre */}
        <Source id="cadastre-source" type="geojson" data={cadastreData}>
          <Layer
            id="cadastre-fill"
            type="fill"
            minzoom={MIN_ZOOM_PARCELLES}
            paint={{
              "fill-color": "transparent",
              "fill-outline-color": "transparent",
            }}
          />
          <Layer
            id="cadastre-line"
            type="line"
            minzoom={MIN_ZOOM_PARCELLES}
            paint={{
              "line-color": "#eab308",
              "line-width": 1.5,
              "line-opacity": 0.7,
            }}
          />
          <Layer
            id="cadastre-highlight"
            type="line"
            minzoom={MIN_ZOOM_PARCELLES}
            filter={highlightFilter}
            paint={{
              "line-color": "#ef4444",
              "line-width": 4,
              "line-opacity": 1,
            }}
          />
          <Layer
            id="cadastre-fill-highlight"
            type="fill"
            minzoom={MIN_ZOOM_PARCELLES}
            filter={highlightFilter}
            paint={{ "fill-color": "#ef4444", "fill-opacity": 0.2 }}
          />
        </Source>

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

        {/* Risk zones overlay — slot "middle" pour passer sous les bâtiments 3D */}
        {filteredRisksGeoJson && (
          <Source id="risks-source" type="geojson" data={filteredRisksGeoJson}>
            <Layer
              id="risks-fill"
              type="fill"
              slot="middle"
              paint={{
                "fill-color": ["get", "fillColor"],
                "fill-opacity": 1,
                "fill-emissive-strength": 1,
              }}
            />
          </Source>
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

      {/* Dark overlay that fades once the dusk style is fully rendered */}
      <div
        className="absolute inset-0 bg-slate-950 pointer-events-none transition-opacity duration-700"
        style={{ opacity: isMapReady ? 0 : 1, zIndex: 5 }}
      />

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
