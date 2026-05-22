import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { irisRepository } from "../repositories/irisRepository";
import type { Bbox } from "../types/cadastre";

const DEFAULT_LIMIT = 5_000;

function buildBBoxKey(bbox: Bbox | null): string {
	if (!bbox) {
		return "none";
	}

	return [bbox.west, bbox.south, bbox.east, bbox.north]
		.map((value) => value.toFixed(5))
		.join(",");
}

export function useIrisQuery(bbox: Bbox | null) {
	return useQuery({
		queryKey: ["iris", buildBBoxKey(bbox)],
		queryFn: ({ signal }) => {
			if (!bbox) {
				throw new Error("Missing bbox");
			}

			return irisRepository.getByBbox(bbox, {
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
