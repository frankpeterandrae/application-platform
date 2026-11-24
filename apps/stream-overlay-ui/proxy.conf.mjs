/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { readFileSync } from 'node:fs';
import { BlockList, isIPv6 } from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';

const twitchWrites = new Set(['POST /api/twitch/config/authorize', 'PUT /api/twitch/config/app', 'PUT /api/twitch/config']);
const loopbackPeers = new BlockList();
loopbackPeers.addAddress('127.0.0.1');
loopbackPeers.addAddress('::1', 'ipv6');

export default {
	'/api': {
		target: 'http://localhost:3000',
		secure: false,
		configure(proxy) {
			proxy.on('proxyReq', (outbound, request) => {
				const { authorization, host, origin, forwarded } = request.headers;
				const { localPort, remoteAddress } = request.socket;
				if (
					authorization ||
					!twitchWrites.has(`${request.method} ${request.url}`) ||
					!remoteAddress ||
					!loopbackPeers.check(remoteAddress, isIPv6(remoteAddress) ? 'ipv6' : 'ipv4') ||
					(host !== `localhost:${localPort}` && host !== `127.0.0.1:${localPort}`) ||
					origin !== `http://${host}` ||
					request.headers['sec-fetch-site'] !== 'same-origin' ||
					forwarded !== undefined ||
					Object.keys(request.headers).some((name) => name.startsWith('x-forwarded-'))
				) {
					return;
				}

				const profile = process.env['LOCALAPPDATA'] || join(homedir(), '.config');
				try {
					const file = readFileSync(join(profile, 'StreamOverlay', 'twitch-config.json'), 'utf8');
					const settings = JSON.parse(file.replace(/^\uFEFF/, ''));
					const key = settings?.configKey;
					if (typeof key === 'string' && /^\S+$/.test(key.trim())) {
						outbound.setHeader('Authorization', `Bearer ${key.trim()}`);
					}
				} catch {
					// The API handles missing authorization and the dashboard offers manual entry.
				}
			});
		}
	}
};
