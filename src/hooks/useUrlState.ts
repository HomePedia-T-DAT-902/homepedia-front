import { useEffect } from "react";
import type { CategoryId } from "../components/FloatingPanel";
import type { Address } from "../types/address";

const VALID_CATEGORIES: CategoryId[] = [
	"schools",
	"health",
	"shops",
	"transport",
	"parks",
	"risks",
	"isochrone",
	"city",
	"prix",
];

export function getInitialStateFromUrl(): {
	address: Address | null;
	category: CategoryId | null;
	radius: number;
} {
	const params = new URLSearchParams(window.location.search);

	const label = params.get("address");
	const lng = params.get("lng");
	const lat = params.get("lat");
	const citycode = params.get("citycode");
	let address: Address | null = null;
	if (label && lng !== null && lat !== null) {
		const lngNum = parseFloat(lng);
		const latNum = parseFloat(lat);
		if (!isNaN(lngNum) && !isNaN(latNum)) {
			address = { label, coordinates: [lngNum, latNum], citycode };
		}
	}

	const cat = params.get("category");
	const category = VALID_CATEGORIES.includes(cat as CategoryId)
		? (cat as CategoryId)
		: null;

	const radiusRaw = Number(params.get("radius"));
	const radius = radiusRaw >= 1 && radiusRaw <= 30 ? Math.round(radiusRaw) : 5;

	return { address, category, radius };
}

export function useUrlSync(
	address: Address | null,
	category: CategoryId | null,
	radius: number,
) {
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);

		if (address) {
			params.set("address", address.label);
			params.set("lng", String(address.coordinates[0]));
			params.set("lat", String(address.coordinates[1]));
			if (address.citycode) {
				params.set("citycode", address.citycode);
			} else {
				params.delete("citycode");
			}
		} else {
			params.delete("address");
			params.delete("lng");
			params.delete("lat");
			params.delete("citycode");
		}

		if (category) {
			params.set("category", category);
		} else {
			params.delete("category");
		}

		params.set("radius", String(radius));

		const search = params.toString();
		window.history.replaceState(
			null,
			"",
			search ? `?${search}` : window.location.pathname,
		);
	}, [address, category, radius]);
}
