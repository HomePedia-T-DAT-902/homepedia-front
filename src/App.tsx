import { useRef, useState } from "react";
import { AddressDialog } from "./components/AddressDialog";
import {
	type CategoryId,
	FloatingPanel,
	type PrixViewMode,
} from "./components/FloatingPanel";
import MapView, { type MapViewHandle } from "./components/map/MapView";
import { Sidebar } from "./components/sidebar/Sidebar";
import { TopBar } from "./components/TopBar";
import { useCityQuery } from "./hooks/useCityQuery";
import { useGeorisquesQuery } from "./hooks/useGeorisquesQuery";
import { useIsochroneQuery } from "./hooks/useIsochroneQuery";
import { usePoisQuery } from "./hooks/usePoisQuery";
import { usePrixPointsQuery } from "./hooks/usePrixPointsQuery";
import { useRiskPointsQuery } from "./hooks/useRiskPointsQuery";
import { useRouteDurationsQuery } from "./hooks/useRouteDurationsQuery";
import { useRouteQuery } from "./hooks/useRouteQuery";
import { getInitialStateFromUrl, useUrlSync } from "./hooks/useUrlState";
import type { Address } from "./types/address";
import type { Poi } from "./types/poi";

const initialState = getInitialStateFromUrl();

function App() {
	const mapViewRef = useRef<MapViewHandle | null>(null);
	const [selectedAddress, setSelectedAddress] = useState<Address | null>(
		initialState.address,
	);
	const [activeCategory, setActiveCategory] = useState<CategoryId | null>(
		initialState.category,
	);
	const [radius, setRadius] = useState<number>(initialState.radius);
	const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
	const [prixViewMode, setPrixViewMode] = useState<PrixViewMode>("points");

	useUrlSync(selectedAddress, activeCategory, radius);

	const poisQuery = usePoisQuery(
		activeCategory,
		selectedAddress?.coordinates ?? null,
		radius,
	);

	const routeDurationsQuery = useRouteDurationsQuery(
		selectedAddress?.coordinates ?? null,
		poisQuery.data,
	);

	const routeQuery = useRouteQuery(
		selectedAddress?.coordinates ?? null,
		selectedPoi?.coordinates ?? null,
	);

	const georisquesQuery = useGeorisquesQuery(
		activeCategory === "risks" ? (selectedAddress?.citycode ?? null) : null,
	);
	const riskPointsQuery = useRiskPointsQuery(
		activeCategory === "risks" ? (selectedAddress?.coordinates ?? null) : null,
		radius,
	);
	const isochroneQuery = useIsochroneQuery(
		activeCategory === "isochrone"
			? (selectedAddress?.coordinates ?? null)
			: null,
	);
	const cityQuery = useCityQuery(
		activeCategory === "city" ? (selectedAddress?.citycode ?? null) : null,
	);
	const prixQuery = usePrixPointsQuery(
		activeCategory === "prix" ? (selectedAddress?.coordinates ?? null) : null,
		radius,
	);

	const extraData =
		activeCategory === "risks"
			? georisquesQuery.data
			: activeCategory === "isochrone"
				? isochroneQuery.data
				: activeCategory === "city"
					? cityQuery.data
					: activeCategory === "prix"
						? {
								...prixQuery.data,
								viewMode: prixViewMode,
								onViewModeChange: setPrixViewMode,
							}
						: undefined;

	const isExtraLoading =
		activeCategory === "risks"
			? georisquesQuery.isLoading
			: activeCategory === "isochrone"
				? isochroneQuery.isLoading
				: activeCategory === "city"
					? cityQuery.isLoading
					: activeCategory === "prix"
						? prixQuery.isLoading
						: false;

	function handleAddressSelected(address: Address) {
		setSelectedAddress(address);
		setSelectedPoi(null);
	}

	function handleCategoryChange(id: CategoryId | null) {
		setActiveCategory(id);
		setSelectedPoi(null);
	}

	return (
		<main className="w-screen h-screen relative overflow-hidden bg-slate-950">
			{/* Address picker dialog — shown on first load when no address in URL */}
			{!selectedAddress && (
				<AddressDialog onAddressSelected={handleAddressSelected} />
			)}

			{/* Map full screen */}
			<div className="absolute inset-0">
				<MapView
					ref={mapViewRef}
					selectedAddress={selectedAddress}
					activeCategory={activeCategory}
					pois={poisQuery.data}
					poiDurations={routeDurationsQuery.data}
					selectedPoiId={selectedPoi?.id ?? null}
					onPoiSelect={setSelectedPoi}
					routeData={routeQuery.data ?? null}
					isochroneData={isochroneQuery.data}
					riskPointsGeoJson={
						activeCategory === "risks" ? riskPointsQuery.data : undefined
					}
					prixColumnsGeoJson={
						activeCategory === "prix"
							? prixQuery.data?.columnsGeoJson
							: undefined
					}
					prixHeatmapGeoJson={
						activeCategory === "prix"
							? prixQuery.data?.heatmapGeoJson
							: undefined
					}
					prixViewMode={prixViewMode}
					prixMinPrice={prixQuery.data?.minPrice}
					prixMaxPrice={prixQuery.data?.maxPrice}
				/>
			</div>

			{/* Edge vignette + blur */}
			<div
				className="absolute inset-0 pointer-events-none z-[1]"
				style={{
					backdropFilter: "blur(6px)",
					WebkitBackdropFilter: "blur(6px)",
					maskImage:
						"radial-gradient(ellipse at center, transparent 52%, black 90%)",
					WebkitMaskImage:
						"radial-gradient(ellipse at center, transparent 52%, black 90%)",
				}}
			/>

			{/* Dark vignette overlay */}
			<div
				className="absolute inset-0 pointer-events-none z-[1]"
				style={{
					background:
						"radial-gradient(ellipse at center, transparent 50%, rgba(2, 6, 23, 0.65) 100%)",
				}}
			/>

			{/* Top bar */}
			<TopBar
				selectedAddress={selectedAddress}
				onAddressSelected={handleAddressSelected}
				radius={radius}
				onRadiusChange={setRadius}
				onRecenter={() => mapViewRef.current?.recenter()}
			/>

			{/* Full-height sidebar */}
			<Sidebar
				activeCategory={activeCategory}
				onClose={() => handleCategoryChange(null)}
				pois={poisQuery.data}
				isLoading={poisQuery.isLoading}
				extraData={extraData}
				isExtraLoading={isExtraLoading}
				selectedPoiId={selectedPoi?.id ?? null}
				onPoiSelect={setSelectedPoi}
			/>

			{/* Category icon column */}
			<FloatingPanel
				activeCategory={activeCategory}
				onCategoryChange={handleCategoryChange}
			/>
		</main>
	);
}

export default App;
