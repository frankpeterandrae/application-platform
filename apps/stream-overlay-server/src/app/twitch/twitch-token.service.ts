/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { TwitchConfig } from './twitch.config';
import { TwitchError, TwitchHttp } from './twitch.http';

export type TwitchTokenKind = 'app' | 'user';

interface AccessToken {
	accessToken: string;
	expiresAt: number;
}

interface UserToken extends AccessToken {
	refreshToken: string;
}

const VALIDATION_INTERVAL = 60 * 60 * 1000;

/** Shares cached app and user tokens across server features. */
@Injectable()
export class TwitchTokenService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(TwitchTokenService.name);
	private readonly pending: Partial<Record<TwitchTokenKind, Promise<string>>> = {};
	private appToken?: AccessToken;
	private userToken?: UserToken;
	private userTokenDirty = false;
	private validateUserAt = 0;
	private timer?: NodeJS.Timeout;

	constructor(
		@Inject(TwitchConfig) private readonly config: Pick<TwitchConfig, 'clientId' | 'clientSecret' | 'refreshToken' | 'tokenFile'>
	) {}

	/** Initializes and periodically validates a configured user grant. */
	public onModuleInit(): void {
		const { clientId, tokenFile, refreshToken } = this.config;
		if (clientId && tokenFile) {
			const validate = (): void => {
				if (!this.userToken && !refreshToken && !existsSync(tokenFile)) {
					return;
				}
				this.validateUserAt = 0;
				void this.getAccessToken('user').catch((error: TwitchError) => this.logger.warn(error.message));
			};
			validate();
			this.timer = setInterval(validate, VALIDATION_INTERVAL);
			this.timer.unref();
		}
	}

	/** Stops periodic token validation when the server shuts down. */
	public onModuleDestroy(): void {
		clearInterval(this.timer);
	}

	/** Verifies and persists a new user grant while excluding concurrent refreshes. */
	public replaceUserGrant(refreshToken: string): Promise<void> {
		return this.replaceGrant(() => this.refreshUserToken(refreshToken));
	}

	/** Exchanges a dashboard authorization code and saves the returned user grant. */
	public acceptAuthorizationCode(code: string, redirectUri: string, scopes: readonly string[]): Promise<void> {
		return this.replaceGrant(async () => {
			const token = await this.requestToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
			if (!token.refreshToken) {
				throw new TwitchError('authorize user', 'missing refresh token');
			}
			return { ...token, refreshToken: token.refreshToken };
		}, scopes);
	}

	private async replaceGrant(issueToken: () => Promise<UserToken>, scopes: readonly string[] = []): Promise<void> {
		const pending = Promise.resolve(this.pending.user)
			.catch(() => undefined)
			.then(() => this.persistNewGrant(issueToken, scopes));
		this.pending.user = pending;
		try {
			await pending;
		} finally {
			if (this.pending.user === pending) {
				delete this.pending.user;
			}
		}
	}

	/** Pass a token rejected with HTTP 401 to replace it without duplicating concurrent refreshes. */
	public async getAccessToken(kind: TwitchTokenKind = 'app', rejectedToken?: string): Promise<string> {
		const inFlight = this.pending[kind];
		if (inFlight) {
			const token = await inFlight;
			return token === rejectedToken ? this.getAccessToken(kind, rejectedToken) : token;
		}

		const pending = kind === 'app' ? this.getAppToken(rejectedToken) : this.getUserToken(rejectedToken);
		this.pending[kind] = pending;
		try {
			return await pending;
		} finally {
			if (this.pending[kind] === pending) {
				delete this.pending[kind];
			}
		}
	}

	private async getAppToken(rejectedToken?: string): Promise<string> {
		if (!this.isUsable(this.appToken, rejectedToken)) {
			this.appToken = undefined;
			this.appToken = await this.requestToken({ grant_type: 'client_credentials' });
		}
		return this.appToken.accessToken;
	}

	private async getUserToken(rejectedToken?: string): Promise<string> {
		const file = this.config.tokenFile;

		this.userToken ??= await this.loadUserToken(file);
		if (this.userTokenDirty && this.userToken) {
			await this.saveUserToken(file, this.userToken);
		}

		if (this.isUsable(this.userToken, rejectedToken)) {
			if (Date.now() < this.validateUserAt) {
				return this.userToken.accessToken;
			}
			try {
				this.validateUserAt = await this.validateUserToken(this.userToken.accessToken);
				return this.userToken.accessToken;
			} catch (error) {
				if (!(error instanceof TwitchError) || error.status !== 401) {
					throw error;
				}
			}
		}

		const refreshToken = this.userToken?.refreshToken ?? this.config.refreshToken;
		if (this.userToken) {
			this.userToken.expiresAt = 0;
		}
		if (!refreshToken) {
			throw new TwitchError('user OAuth', 'initialize a user grant in the dashboard or with TWITCH_REFRESH_TOKEN');
		}

		this.userToken = await this.refreshUserToken(refreshToken);
		this.validateUserAt = 0;
		this.userTokenDirty = true;
		await this.saveUserToken(file, this.userToken);
		this.validateUserAt = await this.validateUserToken(this.userToken.accessToken);
		return this.userToken.accessToken;
	}

	private async persistNewGrant(issueToken: () => Promise<UserToken>, scopes: readonly string[]): Promise<string> {
		const token = await issueToken();
		const validateAt = await this.validateUserToken(token.accessToken, scopes);
		await this.saveUserToken(this.config.tokenFile, token);
		this.userToken = token;
		this.validateUserAt = validateAt;
		return token.accessToken;
	}

	private async refreshUserToken(refreshToken: string): Promise<UserToken> {
		const token = await this.requestToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
		return { ...token, refreshToken: token.refreshToken ?? refreshToken };
	}

	private isUsable(token: AccessToken | undefined, rejectedToken?: string): token is AccessToken {
		return Boolean(token && token.expiresAt > Date.now() && token.accessToken !== rejectedToken);
	}

	private async validateUserToken(token: string, requiredScopes: readonly string[] = []): Promise<number> {
		const operation = 'validate user token';
		const response = await TwitchHttp.request(operation, new URL('https://id.twitch.tv/oauth2/validate'), {
			headers: { Authorization: `OAuth ${token}` }
		});
		const grant = await TwitchHttp.readJson<{ client_id?: string; user_id?: string; scopes?: string[] } | null>(operation, response);
		if (!grant?.user_id || grant.client_id !== this.config.clientId) {
			throw new TwitchError(operation, 'token does not belong to a user of the configured app');
		}
		if (requiredScopes.some((scope) => !grant.scopes?.includes(scope))) {
			throw new TwitchError(operation, 'the user grant is missing requested scopes');
		}
		return Date.now() + VALIDATION_INTERVAL;
	}

	private async requestToken(params: Record<string, string>): Promise<AccessToken & { refreshToken?: string }> {
		let operation = 'issue app token';
		if (params['grant_type'] === 'authorization_code') {
			operation = 'authorize user';
		} else if (params['grant_type'] === 'refresh_token') {
			operation = 'refresh user token';
		}
		const { clientId, clientSecret } = this.config;
		if (!clientId || !clientSecret) {
			throw new TwitchError(operation, 'Twitch app credentials are missing');
		}
		const response = await TwitchHttp.request(operation, new URL('https://id.twitch.tv/oauth2/token'), {
			method: 'POST',
			body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params })
		});
		const token = await TwitchHttp.readJson<{ access_token: string; expires_in: number; refresh_token?: string } | null>(
			operation,
			response
		);
		if (
			!token ||
			typeof token.access_token !== 'string' ||
			!token.access_token ||
			!Number.isFinite(token.expires_in) ||
			token.expires_in <= 0 ||
			(token.refresh_token !== undefined && (typeof token.refresh_token !== 'string' || !token.refresh_token))
		) {
			throw new TwitchError(operation, 'invalid token response');
		}
		return {
			accessToken: token.access_token,
			expiresAt: Date.now() + token.expires_in * 1000,
			refreshToken: token.refresh_token
		};
	}

	private async loadUserToken(file: string): Promise<UserToken | undefined> {
		try {
			const token: UserToken | null = JSON.parse(await readFile(file, 'utf8'));
			if (
				typeof token?.accessToken === 'string' &&
				token.accessToken &&
				Number.isFinite(token.expiresAt) &&
				typeof token.refreshToken === 'string' &&
				token.refreshToken
			) {
				return token;
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return undefined;
			}
		}
		throw new TwitchError('user OAuth', 'cannot read the configured token file');
	}

	private async saveUserToken(file: string, token: UserToken): Promise<void> {
		const temporaryFile = `${file}.${randomUUID()}.tmp`;
		try {
			await writeFile(temporaryFile, JSON.stringify(token), { mode: 0o600, flag: 'wx' });
			await rename(temporaryFile, file);
			this.userTokenDirty = false;
		} catch {
			await rm(temporaryFile, { force: true }).catch(() => undefined);
			throw new TwitchError('user OAuth', 'cannot persist the refreshed token');
		}
	}
}
