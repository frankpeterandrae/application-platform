/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/** Describes a Twitch failure without including credentials or response bodies. */
export class TwitchError extends Error {
	constructor(
		public readonly operation: string,
		public readonly reason: string,
		public readonly status?: number,
		public readonly rateLimit?: { limit?: number; remaining?: number; resetAt?: number }
	) {
		const statusSuffix = status === undefined ? '' : ` (HTTP ${status})`;
		super(`Twitch ${operation}: ${reason}${statusSuffix}`);
		this.name = 'TwitchError';
	}
}

/** Shared HTTP transport for Twitch OAuth and Helix. */
export class TwitchHttp {
	/** Reads an optional numeric rate-limit header. */
	private static readNumber(headers: Headers, key: string): number | undefined {
		const value = headers.get(key);
		return value && /^\d+$/.test(value) ? Number(value) : undefined;
	}

	/** Applies the shared timeout and error handling for Twitch HTTP calls. */
	public static async request(operation: string, url: URL, init?: RequestInit): Promise<Response> {
		let response: Response;
		try {
			response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(10_000) });
		} catch {
			throw new TwitchError(operation, 'network failure or timeout');
		}

		if (!response.ok) {
			await response.body?.cancel().catch(() => undefined);
			const rateLimit =
				response.status === 429
					? {
							limit: TwitchHttp.readNumber(response.headers, 'Ratelimit-Limit'),
							remaining: TwitchHttp.readNumber(response.headers, 'Ratelimit-Remaining'),
							resetAt: TwitchHttp.readNumber(response.headers, 'Ratelimit-Reset')
						}
					: undefined;
			throw new TwitchError(operation, rateLimit ? 'rate limit exceeded' : 'request rejected', response.status, rateLimit);
		}
		return response;
	}

	/** Parses JSON without exposing Twitch response content in errors. */
	public static async readJson<T>(operation: string, response: Response): Promise<T> {
		try {
			return await response.json();
		} catch {
			throw new TwitchError(operation, 'invalid JSON response', response.status);
		}
	}
}
