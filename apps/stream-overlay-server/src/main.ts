/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Entry point for the stream overlay backend.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';

import { AppModule } from './app/app.module';

/**
 * Bootstraps the Nest application.
 */
async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule);

	app.enableShutdownHooks();

	app.useWebSocketAdapter(new WsAdapter(app));
	const port = process.env['PORT'] || 3000;
	await app.listen(port);
	Logger.log(`🚀 Application is running on: http://localhost:${port}/`);
}

bootstrap();
