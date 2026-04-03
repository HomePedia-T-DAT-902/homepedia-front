export interface HttpQueryParams {
	[key: string]: string | number | boolean | undefined;
}

export interface HttpRequestOptions {
	signal?: AbortSignal;
	query?: HttpQueryParams;
}

export interface HttpClient {
	getJson<T>(path: string, options?: HttpRequestOptions): Promise<T>;
}

export class FetchHttpClient implements HttpClient {
	private readonly baseUrl: string;

	constructor(baseUrl?: string) {
		this.baseUrl = baseUrl?.trim() ? baseUrl : window.location.origin;
	}

	async getJson<T>(path: string, options?: HttpRequestOptions): Promise<T> {
		const url = new URL(path, this.baseUrl);

		if (options?.query) {
			for (const [key, value] of Object.entries(options.query)) {
				if (value !== undefined) {
					url.searchParams.set(key, String(value));
				}
			}
		}

		const response = await fetch(url.toString(), {
			signal: options?.signal,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		return (await response.json()) as T;
	}
}
