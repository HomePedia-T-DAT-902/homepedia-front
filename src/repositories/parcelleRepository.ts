import { FetchHttpClient, type HttpClient } from "../api/httpClient";
import type { Bbox, CadastreFeatureCollection } from "../types/cadastre";

const DEFAULT_LIMIT = 10_000;

export interface ParcelleRepository {
	getByBbox(
		bbox: Bbox,
		options?: { signal?: AbortSignal; limit?: number },
	): Promise<CadastreFeatureCollection>;
}

export class ApiParcelleRepository implements ParcelleRepository {
	private readonly httpClient: HttpClient;

	constructor(httpClient: HttpClient) {
		this.httpClient = httpClient;
	}

	async getByBbox(
		bbox: Bbox,
		options?: { signal?: AbortSignal; limit?: number },
	): Promise<CadastreFeatureCollection> {
		const limit = options?.limit ?? DEFAULT_LIMIT;
		const bboxValue = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;

		return this.httpClient.getJson<CadastreFeatureCollection>(
			"/api/v1/geo/parcelles",
			{
				signal: options?.signal,
				query: {
					bbox: bboxValue,
					limit,
				},
			},
		);
	}
}

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
export const parcelleRepository = new ApiParcelleRepository(
	new FetchHttpClient(apiUrl),
);
