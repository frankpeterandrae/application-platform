/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Module } from '@nestjs/common';

import { TwitchChannelController } from './twitch-channel.controller';
import { TwitchConfigController } from './twitch-config.controller';
import { TwitchHelixClient } from './twitch-helix.client';
import { TwitchTokenService } from './twitch-token.service';
import { TwitchConfig } from './twitch.config';

/** Makes Twitch authentication and Helix available to backend features. */
@Module({
	controllers: [TwitchConfigController, TwitchChannelController],
	providers: [TwitchConfig, TwitchTokenService, TwitchHelixClient],
	exports: [TwitchTokenService, TwitchHelixClient]
})
export class TwitchModule {}
