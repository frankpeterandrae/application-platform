/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Inject, Injectable } from '@nestjs/common';

import { TwitchTokenKind, TwitchTokenService } from './twitch-token.service';
import { TwitchConfig } from './twitch.config';
import { TwitchError, TwitchHttp } from './twitch.http';

export interface TwitchUser {
	id: string;
	login: string;
	display_name: string;
	description: string;
	profile_image_url: string;
}

export interface TwitchChannel {
	broadcaster_id: string;
	broadcaster_login: string;
	broadcaster_name: string;
	broadcaster_language: string;
	game_id: string;
	game_name: string;
	title: string;
	tags: string[];
}

/** Provides authenticated access to the Twitch Helix API. */
@Injectable()
export class TwitchHelixClient {
	constructor(
		@Inject(TwitchConfig) private readonly config: Pick<TwitchConfig, 'clientId'>,
		@Inject(TwitchTokenService) private readonly tokens: TwitchTokenService
	) {}

	/** Looks up a Twitch user by login name. */
	public getUserByLogin(login: string): Promise<TwitchUser | undefined> {
		return this.getFirst('users', new URLSearchParams({ login }));
	}

	/** Looks up a Twitch user by ID. */
	public getUserById(id: string): Promise<TwitchUser | undefined> {
		return this.getFirst('users', new URLSearchParams({ id }));
	}

	/** Gets the user represented by the connected Twitch account. */
	public getAuthenticatedUser(): Promise<TwitchUser | undefined> {
		return this.getFirst('users', new URLSearchParams(), 'user');
	}

	/** Looks up channel information by broadcaster ID. */
	public getChannel(broadcasterId: string): Promise<TwitchChannel | undefined> {
		return this.getFirst('channels', new URLSearchParams({ broadcaster_id: broadcasterId }));
	}

	/** Shared transport for Helix endpoints that require either an app or a user grant. */
	public async request(
		resource: string,
		query = new URLSearchParams(),
		kind: TwitchTokenKind = 'app',
		options: { method?: string; json?: unknown } = {}
	): Promise<Response> {
		if (!/^[a-z0-9_]+(?:\/[a-z0-9_]+)*$/.test(resource)) {
			throw new TwitchError('Helix', 'invalid resource path');
		}
		const url = new URL(`https://api.twitch.tv/helix/${resource}`);
		url.search = query.toString();
		const body = options.json === undefined ? undefined : JSON.stringify(options.json);
		const send = (token: string): Promise<Response> =>
			TwitchHttp.request(`Helix ${resource}`, url, {
				method: options.method ?? 'GET',
				body,
				headers: {
					'Client-Id': this.config.clientId ?? '',
					Authorization: `Bearer ${token}`,
					...(body === undefined ? {} : { 'Content-Type': 'application/json' })
				}
			});

		const token = await this.tokens.getAccessToken(kind);
		try {
			return await send(token);
		} catch (error) {
			if (!(error instanceof TwitchError) || error.status !== 401) {
				throw error;
			}
			return send(await this.tokens.getAccessToken(kind, token));
		}
	}

	private async getFirst<T>(resource: string, query: URLSearchParams, kind: TwitchTokenKind = 'app'): Promise<T | undefined> {
		const value = await TwitchHttp.readJson<{ data: T[] } | null>(`Helix ${resource}`, await this.request(resource, query, kind));
		if (!Array.isArray(value?.data)) {
			throw new TwitchError(`Helix ${resource}`, 'invalid data response');
		}
		return value.data[0];
	}
}
