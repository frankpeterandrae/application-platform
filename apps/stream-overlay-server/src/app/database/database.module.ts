/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Module } from '@nestjs/common';

import { DatabaseService } from './database.service';
import { DB } from './database.token';

/**
 * Provides and exports the stream overlay database service and injection token.
 */
@Module({
	providers: [
		DatabaseService,
		{
			provide: DB,
			useExisting: DatabaseService
		}
	],
	exports: [DatabaseService, DB]
})
export class DatabaseModule {}
