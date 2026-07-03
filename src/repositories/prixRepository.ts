import { FetchHttpClient, type HttpClient } from "../api/httpClient";
import type { TransactionPoint } from "../types/prix";

export interface PrixRepository {
	getPoints(
		bbox: [minLon: number, minLat: number, maxLon: number, maxLat: number],
		options?: { limit?: number; signal?: AbortSignal },
	): Promise<TransactionPoint[]>;
}

export class ApiPrixRepository implements PrixRepository {
	private readonly httpClient: HttpClient;

	constructor(httpClient: HttpClient) {
		this.httpClient = httpClient;
	}

	async getPoints(
		bbox: [minLon: number, minLat: number, maxLon: number, maxLat: number],
		options?: { limit?: number; signal?: AbortSignal },
	): Promise<TransactionPoint[]> {
		return this.httpClient.getJson<TransactionPoint[]>("/api/v1/prix/points", {
			signal: options?.signal,
			query: {
				bbox: bbox.join(","),
				limit: options?.limit,
			},
		});
	}
}

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
export const prixRepository = new ApiPrixRepository(new FetchHttpClient(apiUrl));
