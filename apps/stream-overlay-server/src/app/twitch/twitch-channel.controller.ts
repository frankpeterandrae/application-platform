/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import {
	BadGatewayException,
	Controller,
	Get,
	Header,
	HttpException,
	HttpStatus,
	Inject,
	NotFoundException,
	ServiceUnavailableException
} from '@nestjs/common';

import { TwitchHelixClient } from './twitch-helix.client';
import { TwitchError } from './twitch.http';

/** Serves channel information for the connected Twitch account. */
@Controller('api/twitch')
export class TwitchChannelController {
	constructor(@Inject(TwitchHelixClient) private readonly helix: TwitchHelixClient) {}

	/** Returns the title Twitch currently reports for the connected channel. */
	@Get('stream-title')
	@Header('Cache-Control', 'no-store')
	public async getStreamTitle(): Promise<{ title: string }> {
		const title = await this.fetchTitle();
		if (!title?.trim()) {
			throw new NotFoundException('The connected Twitch channel has no stream title.');
		}
		return { title };
	}

	private async fetchTitle(): Promise<string | undefined> {
		try {
			const user = await this.helix.getAuthenticatedUser();
			const channel = user && (await this.helix.getChannel(user.id));
			return channel?.title;
		} catch (error) {
			if (error instanceof TwitchError) {
				if (error.status === 429) {
					throw new HttpException('The Twitch rate limit has been reached.', HttpStatus.TOO_MANY_REQUESTS);
				}
				if (
					error.operation === 'user OAuth' ||
					error.status === 401 ||
					(error.operation === 'refresh user token' && error.status === 400)
				) {
					throw new ServiceUnavailableException('The Twitch account is not available.');
				}
			}
			throw new BadGatewayException('Could not read the stream title from Twitch.');
		}
	}
}
