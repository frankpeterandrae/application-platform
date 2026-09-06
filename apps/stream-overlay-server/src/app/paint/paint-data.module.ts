/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import path from 'node:path';

import {
	PaintBrandRepository,
	PaintRecentSelectionRepository,
	PaintRepository,
	PaintSnapshotService
} from '@application-platform/paint-data-access';
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';

import { PaintController } from './paint.controller';

/**
 * Provides the paint repositories and snapshot service used by the backend.
 *
 * The repositories share the application database and the persistent paint
 * repositories use PaintSnapshotService to track snapshot changes.
 */
@Module({
	imports: [DatabaseModule],
	controllers: [PaintController],
	providers: [
		{
			provide: PaintSnapshotService,
			inject: [DatabaseService],
			useFactory: (databaseService: DatabaseService): PaintSnapshotService =>
				new PaintSnapshotService(databaseService.db, path.join(process.cwd(), 'libs', 'shared', 'paint-data-access-old', 'data'))
		},
		{
			provide: PaintRepository,
			inject: [DatabaseService, PaintSnapshotService],
			useFactory: (databaseService: DatabaseService, paintSnapshotService: PaintSnapshotService): PaintRepository =>
				new PaintRepository(databaseService.db, paintSnapshotService)
		},
		{
			provide: PaintBrandRepository,
			inject: [DatabaseService, PaintSnapshotService],
			useFactory: (databaseService: DatabaseService, paintSnapshotService: PaintSnapshotService): PaintBrandRepository =>
				new PaintBrandRepository(databaseService.db, paintSnapshotService)
		},
		{
			provide: PaintRecentSelectionRepository,
			inject: [DatabaseService],
			useFactory: (databaseService: DatabaseService): PaintRecentSelectionRepository =>
				new PaintRecentSelectionRepository(databaseService.db)
		}
	],
	exports: [PaintRepository, PaintBrandRepository, PaintRecentSelectionRepository]
})
export class PaintDataModule {}
