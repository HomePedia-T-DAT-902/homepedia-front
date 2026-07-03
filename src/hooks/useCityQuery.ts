import { useQuery } from "@tanstack/react-query";
import { communeRepository } from "../repositories/communeRepository";
import { educationRepository } from "../repositories/educationRepository";
import { equipementRepository } from "../repositories/equipementRepository";
import { reviewRepository } from "../repositories/reviewRepository";
import { securiteRepository } from "../repositories/securiteRepository";
import type { CityData } from "../types/city";

const STALE_TIME = 60 * 60_000;
const GC_TIME = 120 * 60_000;

export function useCityQuery(codeCommune: string | null) {
	const enabled = codeCommune !== null;

	const communeQuery = useQuery({
		queryKey: ["commune", codeCommune],
		queryFn: ({ signal }) =>
			communeRepository.getByCommune(codeCommune as string, { signal }),
		enabled,
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});

	const reviewsQuery = useQuery({
		queryKey: ["reviews", codeCommune],
		queryFn: ({ signal }) =>
			reviewRepository.getByCommune(codeCommune as string, { signal }),
		enabled,
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
	});

	const equipementsQuery = useQuery({
		queryKey: ["equipements", codeCommune],
		queryFn: ({ signal }) =>
			equipementRepository.getByCommune(codeCommune as string, { signal }),
		enabled,
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
		retry: false,
	});

	const securiteQuery = useQuery({
		queryKey: ["securite", codeCommune],
		queryFn: ({ signal }) =>
			securiteRepository.getByCommune(codeCommune as string, { signal }),
		enabled,
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
		retry: false,
	});

	const educationQuery = useQuery({
		queryKey: ["education", codeCommune],
		queryFn: ({ signal }) =>
			educationRepository.getByCommune(codeCommune as string, { signal }),
		enabled,
		staleTime: STALE_TIME,
		gcTime: GC_TIME,
		retry: false,
	});

	const data: CityData | undefined = communeQuery.data && {
		nom: communeQuery.data.nom,
		codePostal: communeQuery.data.code_postal ?? undefined,
		population: communeQuery.data.population ?? undefined,
		codeDepartement: communeQuery.data.code_departement ?? undefined,
		nomDepartement: communeQuery.data.nom_departement ?? undefined,
		codeRegion: communeQuery.data.code_region ?? undefined,
		nomRegion: communeQuery.data.nom_region ?? undefined,
		superficie: communeQuery.data.superficie ?? undefined,
		noteGlobale: reviewsQuery.data?.note_globale ?? undefined,
		wordCloud: reviewsQuery.data?.word_cloud,
		equipements: equipementsQuery.data,
		securite: securiteQuery.data?.historique.at(-1),
		education: educationQuery.data?.historique.at(-1),
	};

	return {
		data,
		isLoading: communeQuery.isLoading,
	};
}
