import { FetchHttpClient, type HttpClient } from "../api/httpClient";

export interface CommuneEndpointRepository<T> {
	getByCommune(
		codeCommune: string,
		options?: { signal?: AbortSignal },
	): Promise<T>;
}

/** Builds a repository for the many `/api/v1/<resource>/:codeCommune` endpoints,
 * which all share the same shape and only differ by path and response type. */
export function createCommuneRepository<T>(
	path: string,
): CommuneEndpointRepository<T> {
	const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
	const httpClient: HttpClient = new FetchHttpClient(apiUrl);

	return {
		async getByCommune(codeCommune, options) {
			return httpClient.getJson<T>(`/api/v1/${path}/${codeCommune}`, {
				signal: options?.signal,
			});
		},
	};
}
