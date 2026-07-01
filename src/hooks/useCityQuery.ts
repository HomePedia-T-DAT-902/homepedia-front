import { useQuery } from "@tanstack/react-query";
import type { CityData } from "../types/city";

const MOCK_DATA: CityData = {
	nom: "Rennes",
	codePostal: "35000",
	population: 222_342,
	codeDepartement: "35",
	nomDepartement: "Ille-et-Vilaine",
	codeRegion: "53",
	nomRegion: "Bretagne",
	superficie: 50.39,
	noteGlobale: 7.8,
};

export function useCityQuery(coordinates: [number, number] | null) {
	return useQuery({
		queryKey: [
			"city",
			coordinates?.[0]?.toFixed(4),
			coordinates?.[1]?.toFixed(4),
		],
		queryFn: (): Promise<CityData> =>
			new Promise((resolve) => setTimeout(() => resolve(MOCK_DATA), 500)),
		enabled: coordinates !== null,
		staleTime: 60 * 60_000,
		gcTime: 120 * 60_000,
	});
}
