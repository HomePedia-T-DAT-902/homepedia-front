import { useQuery } from "@tanstack/react-query";
import { FetchHttpClient } from "../api/httpClient";
import type { Address, BanFeatureCollection } from "../types/address";
import { useDebouncedValue } from "./useDebouncedValue";

const banHttpClient = new FetchHttpClient("https://api-adresse.data.gouv.fr");

export function useAddressSearch(query: string): {
	results: Address[];
	isLoading: boolean;
} {
	const debouncedQuery = useDebouncedValue(query, 300);

	const queryResult = useQuery({
		queryKey: ["ban-search", debouncedQuery],
		queryFn: ({ signal }) =>
			banHttpClient.getJson<BanFeatureCollection>("/search/", {
				signal,
				query: { q: debouncedQuery, limit: 5 },
			}),
		enabled: debouncedQuery.length >= 2,
		staleTime: 30_000,
		select: (data) =>
			data.features.map((f) => ({
				label: f.properties.label,
				coordinates: f.geometry.coordinates,
				citycode: f.properties.citycode ?? null,
			})),
	});

	return {
		results: queryResult.data ?? [],
		isLoading: queryResult.isLoading,
	};
}
