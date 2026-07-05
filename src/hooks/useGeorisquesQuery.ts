import { useQuery } from "@tanstack/react-query";
import { qualiteAirRepository } from "../repositories/qualiteAirRepository";
import { risqueRepository } from "../repositories/risqueRepository";
import type { GeorisquesData } from "../types/georisques";

export function useGeorisquesQuery(codeCommune: string | null) {
	const risquesQuery = useQuery({
		queryKey: ["risques", codeCommune],
		queryFn: ({ signal }) =>
			risqueRepository.getByCommune(codeCommune as string, { signal }),
		enabled: codeCommune !== null,
		staleTime: 60 * 60_000,
		gcTime: 60 * 60_000,
		retry: false,
	});

	const qualiteAirQuery = useQuery({
		queryKey: ["qualite-air", codeCommune],
		queryFn: ({ signal }) =>
			qualiteAirRepository.getByCommune(codeCommune as string, { signal }),
		enabled: codeCommune !== null,
		staleTime: 60 * 60_000,
		gcTime: 60 * 60_000,
		retry: false,
	});

	const data: GeorisquesData | undefined =
		risquesQuery.data || qualiteAirQuery.data
			? { risques: risquesQuery.data, qualiteAir: qualiteAirQuery.data }
			: undefined;

	return {
		data,
		isLoading: risquesQuery.isLoading || qualiteAirQuery.isLoading,
	};
}
