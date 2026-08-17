/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Module } from '@nestjs/common';

import { PaintDataModule } from './paint/paint-data.module';
import { PaintStateService } from './paint/paint-state.service';
import { PaintGateway } from './paint/paint.gateway';
import { StreamStateService } from './stream/stream-state.service';
import { StreamGateway } from './stream/stream.gateway';

/**
 * Root module for the stream overlay server.
 */
@Module({
	imports: [PaintDataModule],
	controllers: [],
	providers: [PaintGateway, PaintStateService, StreamGateway, StreamStateService]
})
export class AppModule {}
