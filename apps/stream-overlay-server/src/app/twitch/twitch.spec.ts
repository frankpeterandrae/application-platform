/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { TwitchChannelController } from './twitch-channel.controller';
import { TwitchConfigController } from './twitch-config.controller';
import { TwitchHelixClient } from './twitch-helix.client';
import { TwitchTokenService } from './twitch-token.service';
import { TwitchConfig } from './twitch.config';

const appConfig = {
	clientId: 'test-client',
	clientSecret: 'test-secret',
	refreshToken: undefined,
	tokenFile: ''
};

describe('Twitch integration', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	it('loads the title from the channel belonging to the authenticated account', async () => {
		const tokens = new TwitchTokenService(appConfig);
		vi.spyOn(tokens, 'getAccessToken').mockResolvedValueOnce('user-token').mockResolvedValueOnce('app-token');
		const twitch = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ data: [{ id: '123' }] }))
			.mockResolvedValueOnce(Response.json({ data: [{ title: 'Model building' }] }));
		vi.stubGlobal('fetch', twitch);

		const controller = new TwitchChannelController(new TwitchHelixClient(appConfig, tokens));
		await expect(controller.getStreamTitle()).resolves.toEqual({ title: 'Model building' });
		expect(twitch).toHaveBeenNthCalledWith(
			1,
			new URL('https://api.twitch.tv/helix/users'),
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer user-token' })
			})
		);
		expect(twitch).toHaveBeenNthCalledWith(
			2,
			new URL('https://api.twitch.tv/helix/channels?broadcaster_id=123'),
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: 'Bearer app-token' })
			})
		);
	});

	it.each([undefined, '', '   '])('returns 404 when the connected channel has no title (%j)', async (title) => {
		const tokens = new TwitchTokenService(appConfig);
		vi.spyOn(tokens, 'getAccessToken').mockResolvedValue('token');
		vi.stubGlobal(
			'fetch',
			vi
				.fn<typeof fetch>()
				.mockResolvedValueOnce(Response.json({ data: [{ id: '123' }] }))
				.mockResolvedValueOnce(Response.json({ data: title === undefined ? [] : [{ title }] }))
		);

		const controller = new TwitchChannelController(new TwitchHelixClient(appConfig, tokens));
		await expect(controller.getStreamTitle()).rejects.toMatchObject({ status: 404 });
	});

	it.each([
		[429, 429],
		[401, 503],
		[502, 502]
	])('maps Twitch HTTP %i to local HTTP %i when reading the stream title', async (twitchStatus, localStatus) => {
		const tokens = new TwitchTokenService(appConfig);
		vi.spyOn(tokens, 'getAccessToken').mockResolvedValue('token');
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>().mockImplementation(async () => new Response(null, { status: twitchStatus }))
		);

		const controller = new TwitchChannelController(new TwitchHelixClient(appConfig, tokens));
		await expect(controller.getStreamTitle()).rejects.toMatchObject({ status: localStatus });
	});

	it('returns 503 before contacting Helix when no Twitch account is connected', async () => {
		const twitch = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', twitch);
		const controller = new TwitchChannelController(new TwitchHelixClient(appConfig, new TwitchTokenService(appConfig)));

		await expect(controller.getStreamTitle()).rejects.toMatchObject({ status: 503 });
		expect(twitch).not.toHaveBeenCalled();
	});

	it('reports transport errors and malformed Twitch responses without leaking upstream details', async () => {
		const tokens = new TwitchTokenService(appConfig);
		vi.spyOn(tokens, 'getAccessToken').mockResolvedValue('token');
		const twitch = vi
			.fn<typeof fetch>()
			.mockRejectedValueOnce(new Error('private transport details'))
			.mockResolvedValueOnce(new Response('invalid JSON'))
			.mockResolvedValueOnce(Response.json({ error: 'unexpected payload' }));
		vi.stubGlobal('fetch', twitch);
		const client = new TwitchHelixClient(appConfig, tokens);

		await expect(client.getUserById('123')).rejects.toMatchObject({ reason: 'network failure or timeout' });
		await expect(client.getUserById('123')).rejects.toMatchObject({ reason: 'invalid JSON response' });
		await expect(client.getUserById('123')).rejects.toMatchObject({ reason: 'invalid data response' });
	});

	it('protects dashboard writes and keeps the saved grant when Twitch rejects a replacement', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'stream-twitch-'));
		try {
			vi.stubEnv('LOCALAPPDATA', directory);
			vi.stubEnv('TWITCH_CLIENT_ID', undefined);
			vi.stubEnv('TWITCH_CLIENT_SECRET', undefined);
			vi.stubEnv('TWITCH_CONFIG_KEY', undefined);
			vi.stubEnv('TWITCH_TOKEN_FILE', undefined);
			vi.stubEnv('TWITCH_REFRESH_TOKEN', undefined);
			const initial = new TwitchConfig();
			const initialController = new TwitchConfigController(initial, new TwitchTokenService(initial));
			const authorization = `Bearer ${initial.configKey}`;
			expect(() => initialController.saveApp('Bearer wrong-key', appConfig.clientId, appConfig.clientSecret)).toThrow();
			expect(new TwitchConfig().clientId).toBeUndefined();
			initialController.saveApp(authorization, appConfig.clientId, appConfig.clientSecret);
			const config = new TwitchConfig();
			expect(config).toMatchObject({
				clientId: appConfig.clientId,
				clientSecret: appConfig.clientSecret,
				configKey: initial.configKey
			});
			const tokens = new TwitchTokenService(config);
			const controller = new TwitchConfigController(config, tokens);
			const fetchMock = vi.fn<typeof fetch>(async (url, options) => {
				if (String(url).endsWith('/validate')) {
					return Response.json({ client_id: config.clientId, user_id: '123' });
				}
				const refreshToken = new URLSearchParams(String(options?.body)).get('refresh_token');
				return refreshToken === 'valid'
					? Response.json({ access_token: 'user', refresh_token: 'rotated', expires_in: 3600 })
					: new Response(null, { status: 400 });
			});
			vi.stubGlobal('fetch', fetchMock);

			await expect(controller.save('Bearer wrong-key', 'valid')).rejects.toMatchObject({ status: 401 });
			await expect(initialController.save(authorization, 'valid')).rejects.toMatchObject({ status: 503 });
			await expect(controller.save(authorization, '   ')).rejects.toMatchObject({ status: 400 });
			expect(fetchMock).not.toHaveBeenCalled();
			await expect(controller.save(authorization, 'valid')).resolves.toBeUndefined();
			await expect(controller.save(authorization, 'invalid')).rejects.toMatchObject({ status: 400 });
			await expect(new TwitchTokenService(config).getAccessToken('user')).resolves.toBe('user');
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});

	it('binds dashboard consent to the browser and stores a Twitch code exchange once', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'stream-twitch-oauth-'));
		const socket = new Socket();
		try {
			vi.stubEnv('LOCALAPPDATA', directory);
			vi.stubEnv('TWITCH_TOKEN_FILE', undefined);
			new TwitchConfig().saveAppCredentials(appConfig);
			const config = new TwitchConfig();
			const controller = new TwitchConfigController(config, new TwitchTokenService(config));
			const origin = 'http://localhost:4200';
			const response = new ServerResponse(new IncomingMessage(socket));
			const scopes = ['user:read:chat', 'moderator:read:followers', 'channel:read:subscriptions', 'bits:read'];
			const fetchMock = vi.fn<typeof fetch>(async (url, options) => {
				if (String(url).endsWith('/validate')) {
					return Response.json({ client_id: config.clientId, user_id: '123', scopes });
				}
				const params = new URLSearchParams(String(options?.body));
				expect(Object.fromEntries(params)).toEqual({
					client_id: config.clientId,
					client_secret: config.clientSecret,
					grant_type: 'authorization_code',
					code: 'test-code',
					redirect_uri: config.redirectUri
				});
				return Response.json({ access_token: 'user', refresh_token: 'fresh', expires_in: 3600 });
			});
			vi.stubGlobal('fetch', fetchMock);

			const key = `Bearer ${config.configKey}`;
			expect(controller.getRedirectUri()).toEqual({ redirectUri: config.redirectUri });
			expect(() => controller.startAuthorization(key, origin, false, false, false, response)).toThrow('Choose at least one');
			expect(() => controller.startAuthorization(key, 'http://127.0.0.1:4200', true, false, false, response)).toThrow(
				'same hostname'
			);

			const authorization = controller.startAuthorization(key, origin, true, false, true, response);
			const twitchUrl = new URL(authorization.url);
			expect(twitchUrl.origin).toBe('https://id.twitch.tv');
			expect(twitchUrl.searchParams.get('scope')).toBe(scopes.join(' '));
			expect(twitchUrl.searchParams.get('client_secret')).toBeNull();
			const state = twitchUrl.searchParams.get('state');
			const setCookie = String(response.getHeader('Set-Cookie'));
			expect(setCookie).toContain('HttpOnly; SameSite=Lax');
			const cookie = setCookie.split(';')[0];

			await expect(controller.completeAuthorization(state, 'test-code', undefined, undefined, response)).rejects.toMatchObject({
				status: 400
			});
			expect(fetchMock).not.toHaveBeenCalled();
			await expect(controller.completeAuthorization(state, 'test-code', undefined, cookie, response)).resolves.toEqual({
				url: `${origin}/dashboard/config?twitch=connected`
			});
			await expect(controller.completeAuthorization(state, 'test-code', undefined, cookie, response)).rejects.toMatchObject({
				status: 400
			});
			expect(fetchMock).toHaveBeenCalledTimes(2);
			await expect(new TwitchTokenService(config).getAccessToken('user')).resolves.toBe('user');

			const deniedUrl = controller.startAuthorization(key, origin, false, true, false, response).url;
			const deniedState = new URL(deniedUrl).searchParams.get('state');
			const deniedCookie = String(response.getHeader('Set-Cookie')).split(';')[0];
			const callsBeforeDenial = fetchMock.mock.calls.length;
			await expect(
				controller.completeAuthorization(deniedState, undefined, 'access_denied', deniedCookie, response)
			).resolves.toEqual({
				url: `${origin}/dashboard/config?twitch=denied`
			});
			expect(fetchMock).toHaveBeenCalledTimes(callsBeforeDenial);

			vi.useFakeTimers({ toFake: ['Date'] });
			const expiredUrl = controller.startAuthorization(key, origin, true, false, false, response).url;
			const expiredState = new URL(expiredUrl).searchParams.get('state');
			const expiredCookie = String(response.getHeader('Set-Cookie')).split(';')[0];
			vi.setSystemTime(Date.now() + 601_000);
			await expect(controller.completeAuthorization(expiredState, 'test-code', undefined, expiredCookie, response)).resolves.toEqual({
				url: `${origin}/dashboard/config?twitch=expired`
			});
			expect(fetchMock).toHaveBeenCalledTimes(callsBeforeDenial);
		} finally {
			socket.destroy();
			await rm(directory, { force: true, recursive: true });
		}
	});

	it('revalidates a stored grant hourly and stops after shutdown', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'stream-twitch-validation-'));
		const config = { ...appConfig, tokenFile: join(directory, 'tokens.json') };
		const tokens = new TwitchTokenService(config);
		try {
			await writeFile(
				config.tokenFile,
				JSON.stringify({
					accessToken: 'stored',
					refreshToken: 'refresh',
					expiresAt: Date.now() + 2 * 60 * 60 * 1000
				})
			);
			const twitch = vi
				.fn<typeof fetch>()
				.mockImplementation(async () => Response.json({ client_id: config.clientId, user_id: '123' }));
			vi.stubGlobal('fetch', twitch);
			vi.useFakeTimers();

			tokens.onModuleInit();
			await expect(tokens.getAccessToken('user')).resolves.toBe('stored');
			expect(twitch).toHaveBeenCalledTimes(1);
			await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
			expect(twitch).toHaveBeenCalledTimes(2);
			expect(twitch).toHaveBeenLastCalledWith(
				new URL('https://id.twitch.tv/oauth2/validate'),
				expect.objectContaining({
					headers: { Authorization: 'OAuth stored' }
				})
			);

			tokens.onModuleDestroy();
			await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
			expect(twitch).toHaveBeenCalledTimes(2);
		} finally {
			tokens.onModuleDestroy();
			await rm(directory, { force: true, recursive: true });
		}
	});

	it('serializes concurrent grant replacements even when a queued replacement fails', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'stream-twitch-queue-'));
		try {
			const config = { ...appConfig, tokenFile: join(directory, 'tokens.json') };
			const tokens = new TwitchTokenService(config);
			const requests: string[] = [];
			vi.stubGlobal(
				'fetch',
				vi.fn<typeof fetch>(async (url, options) => {
					if (String(url).endsWith('/validate')) {
						const token = new Headers(options?.headers).get('Authorization');
						requests.push(`validate ${token}`);
						return Response.json({ client_id: config.clientId, user_id: '123' });
					}
					const refreshToken = new URLSearchParams(String(options?.body)).get('refresh_token');
					requests.push(`exchange ${refreshToken}`);
					return refreshToken === 'invalid'
						? new Response(null, { status: 400 })
						: Response.json({ access_token: refreshToken, expires_in: 3600 });
				})
			);

			const replacements = ['first', 'invalid', 'last'].map((token) => tokens.replaceUserGrant(token));
			const accessToken = tokens.getAccessToken('user');
			expect((await Promise.allSettled(replacements)).map(({ status }) => status)).toEqual(['fulfilled', 'rejected', 'fulfilled']);
			await expect(accessToken).resolves.toBe('last');
			expect(requests).toEqual([
				'exchange first',
				'validate OAuth first',
				'exchange invalid',
				'exchange last',
				'validate OAuth last'
			]);
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});

	it('renews a rejected app token only once across concurrent Helix requests', async () => {
		let issuedTokens = 0;
		const fetchMock = vi.fn<typeof fetch>(async (url, options) => {
			if (String(url).endsWith('/oauth2/token')) {
				issuedTokens += 1;
				return Response.json({ access_token: `app-${issuedTokens}`, expires_in: 3600 });
			}
			expect(new URL(String(url)).searchParams.get('login')).toBe('a&b');
			const headers = new Headers(options?.headers);
			expect(headers.get('Client-Id')).toBe(appConfig.clientId);
			return headers.get('Authorization') === 'Bearer app-1'
				? new Response(null, { status: 401 })
				: Response.json({ data: [{ id: '123' }] });
		});
		vi.stubGlobal('fetch', fetchMock);

		const client = new TwitchHelixClient(appConfig, new TwitchTokenService(appConfig));
		await expect(Promise.all([client.getUserByLogin('a&b'), client.getUserByLogin('a&b')])).resolves.toEqual([
			{ id: '123' },
			{ id: '123' }
		]);
		expect(issuedTokens).toBe(2);
	});

	it('uses the rotated refresh token after restart', async () => {
		const directory = await mkdtemp(join(tmpdir(), 'stream-twitch-'));
		try {
			const config = { ...appConfig, refreshToken: 'bootstrap&token', tokenFile: join(directory, 'tokens.json') };
			const refreshTokens: Array<string | null> = [];
			vi.stubGlobal(
				'fetch',
				vi.fn<typeof fetch>(async (url, options) => {
					if (String(url).endsWith('/validate')) {
						return Response.json({ client_id: appConfig.clientId, user_id: '123' });
					}
					const params = new URLSearchParams(String(options?.body));
					refreshTokens.push(params.get('refresh_token'));
					return Response.json({
						access_token: `user-${refreshTokens.length}`,
						refresh_token: 'rotated',
						expires_in: 3600
					});
				})
			);

			await expect(new TwitchTokenService(config).getAccessToken('user')).resolves.toBe('user-1');
			const restarted = new TwitchTokenService(config);
			await expect(restarted.getAccessToken('user')).resolves.toBe('user-1');
			await expect(restarted.getAccessToken('user', 'user-1')).resolves.toBe('user-2');
			expect(refreshTokens).toEqual(['bootstrap&token', 'rotated']);
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});

	it('reports the Helix rate limit without replaying the request', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json({ access_token: 'app', expires_in: 3600 }))
			.mockResolvedValueOnce(
				new Response(null, {
					status: 429,
					headers: { 'Ratelimit-Limit': '800', 'Ratelimit-Remaining': '0', 'Ratelimit-Reset': '1800000000' }
				})
			);
		vi.stubGlobal('fetch', fetchMock);

		const client = new TwitchHelixClient(appConfig, new TwitchTokenService(appConfig));
		await expect(client.getChannel('123')).rejects.toMatchObject({
			operation: 'Helix channels',
			status: 429,
			rateLimit: { limit: 800, remaining: 0, resetAt: 1800000000 }
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
