import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { parcelleRepository } from "../repositories/parcelleRepository";
import type { Bbox } from "../types/cadastre";

const DEFAULT_LIMIT = 10_000;

function buildBBoxKey(bbox: Bbox | null): string {
	if (!bbox) {
		return "none";
	}

	return [bbox.west, bbox.south, bbox.east, bbox.north]
		.map((value) => value.toFixed(5))
		.join(",");
}

export function useParcellesQuery(bbox: Bbox | null) {
	return useQuery({
		queryKey: ["parcelles", buildBBoxKey(bbox)],
		queryFn: ({ signal }) => {
			if (!bbox) {
				throw new Error("Missing bbox");
			}

			return parcelleRepository.getByBbox(bbox, {
				signal,
				limit: DEFAULT_LIMIT,
			});
		},
		enabled: bbox !== null,
		placeholderData: keepPreviousData,
		staleTime: 60_000,
		gcTime: 10 * 60_000,
		retry: 1,
	});
}
