import { FetchHttpClient, type HttpClient } from "../api/httpClient";
import type { CommuneRisques, RisqueGeopoint } from "../types/risques";
import { createCommuneRepository } from "./createCommuneRepository";

const GEOPOINTS_LIMIT = 5000;

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
const httpClient: HttpClient = new FetchHttpClient(apiUrl);

export const risqueRepository = {
	...createCommuneRepository<CommuneRisques>("risques"),

	async getGeopoints(
		bbox: [minLon: number, minLat: number, maxLon: number, maxLat: number],
		options?: { signal?: AbortSignal },
	): Promise<RisqueGeopoint[]> {
		return httpClient.getJson<RisqueGeopoint[]>("/api/v1/risques/geopoints", {
			signal: options?.signal,
			query: { bbox: bbox.join(","), limit: GEOPOINTS_LIMIT },
		});
	},
};
