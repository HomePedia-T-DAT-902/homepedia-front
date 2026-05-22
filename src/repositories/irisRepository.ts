import { FetchHttpClient, type HttpClient } from "../api/httpClient";
import type { Bbox } from "../types/cadastre";
import type { IrisFeatureCollection } from "../types/iris";

const DEFAULT_LIMIT = 5_000;

export interface IrisRepository {
	getByBbox(
		bbox: Bbox,
		options?: { signal?: AbortSignal; limit?: number },
	): Promise<IrisFeatureCollection>;
}

export class ApiIrisRepository implements IrisRepository {
	private readonly httpClient: HttpClient;

	constructor(httpClient: HttpClient) {
		this.httpClient = httpClient;
	}

	async getByBbox(
		bbox: Bbox,
		options?: { signal?: AbortSignal; limit?: number },
	): Promise<IrisFeatureCollection> {
		const limit = options?.limit ?? DEFAULT_LIMIT;
		const bboxValue = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;

		return this.httpClient.getJson<IrisFeatureCollection>("/api/v1/geo/iris", {
			signal: options?.signal,
			query: {
				bbox: bboxValue,
				limit,
			},
		});
	}
}

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
export const irisRepository = new ApiIrisRepository(
	new FetchHttpClient(apiUrl),
);
