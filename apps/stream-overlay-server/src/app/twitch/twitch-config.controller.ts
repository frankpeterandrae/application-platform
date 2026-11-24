/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { ServerResponse } from 'node:http';

import {
	BadGatewayException,
	BadRequestException,
	Body,
	Controller,
	Get,
	Header,
	Headers,
	HttpCode,
	HttpStatus,
	Inject,
	InternalServerErrorException,
	Logger,
	Post,
	Put,
	Query,
	Redirect,
	Res,
	ServiceUnavailableException,
	UnauthorizedException
} from '@nestjs/common';

import { TwitchTokenService } from './twitch-token.service';
import { TWITCH_CALLBACK_PATH, TwitchConfig } from './twitch.config';
import { TwitchError } from './twitch.http';

const OAUTH_COOKIE = 'stream_twitch_oauth';
const OAUTH_TIMEOUT_SECONDS = 600;

interface TwitchAuthorization {
	state: string;
	browserKey: string;
	dashboard: URL;
	scopes: string[];
	expiresAt: number;
}

/** Accepts Twitch app credentials and user grants from authorized dashboard operators. */
@Controller('api/twitch/config')
export class TwitchConfigController {
	private readonly logger = new Logger(TwitchConfigController.name);
	private authorization?: TwitchAuthorization;

	constructor(
		@Inject(TwitchConfig) private readonly config: TwitchConfig,
		@Inject(TwitchTokenService) private readonly tokens: TwitchTokenService
	) {}

	/** Returns the exact callback URL operators must register with Twitch. */
	@Get('redirect-uri')
	@Header('Cache-Control', 'no-store')
	public getRedirectUri(): { redirectUri: string } {
		return { redirectUri: this.config.redirectUri };
	}

	/** Starts a browser-bound OAuth request for the dashboard's selected features. */
	@Post('authorize')
	@HttpCode(HttpStatus.OK)
	@Header('Cache-Control', 'no-store')
	public startAuthorization(
		@Headers('authorization') authorization: string | undefined,
		@Headers('origin') origin: string | undefined,
		@Body('chatRead') chatRead: unknown,
		@Body('chatWrite') chatWrite: unknown,
		@Body('alerts') alerts: unknown,
		@Res({ passthrough: true }) response: Pick<ServerResponse, 'setHeader'>
	): { url: string } {
		this.authorize(authorization);
		const { clientId, clientSecret, redirectUri } = this.config;
		if (!clientId || !clientSecret) {
			throw new ServiceUnavailableException('Twitch app credentials are missing.');
		}
		const scopes = [
			...(chatRead === true ? ['user:read:chat'] : []),
			...(chatWrite === true ? ['user:write:chat'] : []),
			...(alerts === true ? ['moderator:read:followers', 'channel:read:subscriptions', 'bits:read'] : [])
		];
		if (!scopes.length) {
			throw new BadRequestException('Choose at least one Twitch feature.');
		}
		const dashboard = this.dashboardUrl(origin, new URL(redirectUri));
		const state = randomBytes(32).toString('hex');
		const browserKey = randomBytes(32).toString('hex');
		this.authorization = { state, browserKey, dashboard, scopes, expiresAt: Date.now() + OAUTH_TIMEOUT_SECONDS * 1000 };
		this.setAuthorizationCookie(response, browserKey, OAUTH_TIMEOUT_SECONDS);

		const url = new URL('https://id.twitch.tv/oauth2/authorize');
		url.search = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			scope: scopes.join(' '),
			state,
			force_verify: 'true'
		}).toString();
		return { url: url.toString() };
	}

	/** Consumes a Twitch callback once and returns the browser to the dashboard. */
	@Get('callback')
	@Redirect(undefined, HttpStatus.SEE_OTHER)
	@Header('Cache-Control', 'no-store')
	@Header('Referrer-Policy', 'no-referrer')
	public async completeAuthorization(
		@Query('state') state: unknown,
		@Query('code') code: unknown,
		@Query('error') error: unknown,
		@Headers('cookie') cookie: string | undefined,
		@Res({ passthrough: true }) response: Pick<ServerResponse, 'setHeader'>
	): Promise<{ url: string }> {
		const attempt = this.authorization;
		const browserKey = cookie
			?.split(';')
			.map((entry) => entry.trim())
			.find((entry) => entry.startsWith(`${OAUTH_COOKIE}=`))
			?.slice(OAUTH_COOKIE.length + 1);
		if (!attempt || attempt.state !== state || attempt.browserKey !== browserKey) {
			throw new BadRequestException('Invalid Twitch authorization. Start again from the dashboard.');
		}
		this.authorization = undefined;
		this.setAuthorizationCookie(response, '', 0);

		let result = 'failed';
		if (Date.now() >= attempt.expiresAt) {
			result = 'expired';
		} else if (error === 'access_denied') {
			result = 'denied';
		} else if (!error && typeof code === 'string' && code) {
			try {
				await this.tokens.acceptAuthorizationCode(code, this.config.redirectUri, attempt.scopes);
				result = 'connected';
			} catch (error_) {
				this.logger.warn(error_ instanceof TwitchError ? error_.message : 'Twitch authorization could not be completed.');
			}
		}
		attempt.dashboard.searchParams.set('twitch', result);
		return { url: attempt.dashboard.toString() };
	}

	/** Saves the app credentials for the next Overlay Server start. */
	@Put('app')
	@HttpCode(HttpStatus.NO_CONTENT)
	public saveApp(
		@Headers('authorization') authorization: string | undefined,
		@Body('clientId') clientId: unknown,
		@Body('clientSecret') clientSecret: unknown
	): void {
		this.authorize(authorization);
		if (typeof clientId !== 'string' || !clientId.trim() || typeof clientSecret !== 'string' || !clientSecret.trim()) {
			throw new BadRequestException('Both Twitch app credentials are required.');
		}
		try {
			this.config.saveAppCredentials({ clientId: clientId.trim(), clientSecret: clientSecret.trim() });
		} catch {
			throw new InternalServerErrorException('Could not save the Twitch app credentials.');
		}
	}

	/** Exchanges a supplied refresh token and stores the resulting grant. */
	@Put()
	@HttpCode(HttpStatus.NO_CONTENT)
	public async save(@Headers('authorization') authorization: string | undefined, @Body('refreshToken') value: unknown): Promise<void> {
		this.authorize(authorization);
		if (!this.config.clientId || !this.config.clientSecret) {
			throw new ServiceUnavailableException('Twitch app credentials are missing.');
		}
		if (typeof value !== 'string' || !value.trim()) {
			throw new BadRequestException('A refresh token is required.');
		}

		try {
			await this.tokens.replaceUserGrant(value.trim());
		} catch (error) {
			if (error instanceof TwitchError && (error.status === 400 || error.status === 401)) {
				throw new BadRequestException('Twitch rejected the user grant.');
			}
			throw new BadGatewayException('The Twitch user grant could not be verified or saved.');
		}
	}

	private authorize(authorization?: string): void {
		const key = authorization?.match(/^Bearer (\S+)$/i)?.[1];
		if (!key || !timingSafeEqual(this.digest(key), this.digest(this.config.configKey))) {
			throw new UnauthorizedException();
		}
	}

	private dashboardUrl(origin: string | undefined, callback: URL): URL {
		const dashboard = URL.parse(origin ?? '');
		if (
			!dashboard ||
			dashboard.origin !== origin ||
			dashboard.protocol !== callback.protocol ||
			dashboard.hostname !== callback.hostname
		) {
			throw new BadRequestException('The dashboard and Twitch callback must use the same hostname and protocol.');
		}
		return new URL('/dashboard/config', dashboard);
	}

	private setAuthorizationCookie(response: Pick<ServerResponse, 'setHeader'>, value: string, maxAge: number): void {
		const secure = this.config.redirectUri.startsWith('https:') ? '; Secure' : '';
		response.setHeader(
			'Set-Cookie',
			`${OAUTH_COOKIE}=${value}; Path=${TWITCH_CALLBACK_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
		);
	}

	private digest(value: string): Buffer {
		return createHash('sha256').update(value).digest();
	}
}
