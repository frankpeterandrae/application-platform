/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

interface AppCredentials {
	clientId: string;
	clientSecret: string;
}

interface LocalSettings extends Partial<AppCredentials> {
	configKey?: string;
	redirectUri?: string;
}

export const TWITCH_CALLBACK_PATH = '/api/twitch/config/callback';

/** Loads the Twitch settings from a private file in the server user's profile. */
@Injectable()
export class TwitchConfig {
	private readonly directory = join(process.env['LOCALAPPDATA'] || join(homedir(), '.config'), 'StreamOverlay');
	private readonly file = join(this.directory, 'twitch-config.json');
	public readonly clientId?: string;
	public readonly clientSecret?: string;
	public readonly refreshToken = process.env['TWITCH_REFRESH_TOKEN']?.trim();
	public readonly tokenFile = process.env['TWITCH_TOKEN_FILE']?.trim() || join(this.directory, 'twitch-tokens.json');
	public readonly configKey: string;
	public readonly redirectUri: string;

	constructor() {
		const stored = this.readSettings();
		const fallbackKey = process.env['TWITCH_CONFIG_KEY']?.trim();
		this.configKey = stored.configKey || fallbackKey || randomBytes(32).toString('hex');
		this.redirectUri = stored.redirectUri || `http://localhost:${process.env['PORT'] || '3000'}${TWITCH_CALLBACK_PATH}`;
		const callback = new URL(this.redirectUri);
		if (
			(callback.protocol !== 'https:' && (callback.protocol !== 'http:' || callback.hostname !== 'localhost')) ||
			callback.pathname !== TWITCH_CALLBACK_PATH ||
			callback.search ||
			callback.hash ||
			callback.username ||
			callback.password
		) {
			throw new Error('Twitch redirectUri must point to the OAuth callback over HTTPS or localhost HTTP.');
		}
		const hasStoredCredentials = Boolean(stored.clientId || stored.clientSecret);
		this.clientId = hasStoredCredentials ? stored.clientId : process.env['TWITCH_CLIENT_ID']?.trim();
		this.clientSecret = hasStoredCredentials ? stored.clientSecret : process.env['TWITCH_CLIENT_SECRET']?.trim();

		if (Boolean(this.clientId) !== Boolean(this.clientSecret)) {
			throw new Error('Twitch requires both a client ID and a client secret.');
		}
		if (!stored.configKey) {
			this.writeSettings({ ...stored, configKey: this.configKey });
		}
	}

	/** Saves both credentials together for the next server start. */
	public saveAppCredentials(credentials: AppCredentials): void {
		this.writeSettings({ ...this.readSettings(), ...credentials, configKey: this.configKey });
	}

	private readSettings(): LocalSettings {
		try {
			const data: LocalSettings | null = JSON.parse(readFileSync(this.file, 'utf8').replace(/^\uFEFF/, ''));
			if (data && typeof data === 'object' && !Array.isArray(data)) {
				const { clientId, clientSecret, configKey, redirectUri } = data;
				if ([clientId, clientSecret, configKey, redirectUri].every((value) => value === undefined || typeof value === 'string')) {
					return {
						clientId: clientId?.trim(),
						clientSecret: clientSecret?.trim(),
						configKey: configKey?.trim(),
						redirectUri: redirectUri?.trim()
					};
				}
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return {};
			}
		}
		throw new Error('Could not read Twitch configuration from the server user profile.');
	}

	private writeSettings(settings: LocalSettings): void {
		const temporaryFile = `${this.file}.${randomUUID()}.tmp`;
		mkdirSync(this.directory, { recursive: true, mode: 0o700 });
		try {
			writeFileSync(temporaryFile, JSON.stringify(settings, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
			renameSync(temporaryFile, this.file);
		} finally {
			rmSync(temporaryFile, { force: true });
		}
	}
}
