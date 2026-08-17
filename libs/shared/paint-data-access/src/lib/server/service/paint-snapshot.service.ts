/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Db, exportDatabaseSnapshot } from '@application-platform/data-db';
import { Logger, OnApplicationShutdown } from '@nestjs/common';

import { paintSnapshotConfig } from './paint-snapshot.config';

/**
 * Manages export snapshots of persistent paint data.
 *
 * Tracks whether exported data is outdated and writes a fresh snapshot
 * during application shutdown when necessary.
 */
export class PaintSnapshotService implements OnApplicationShutdown {
	private readonly logger = new Logger(PaintSnapshotService.name);

	private dirty = false;

	constructor(
		private readonly db: Db,
		private readonly dataDir: string
	) {}

	/**
	 * Marks the persisted snapshot as outdated.
	 */
	public markDirty(): void {
		this.dirty = true;
	}

	/**
	 * Exports the current persistent paint data to the snapshot directory.
	 */
	public export(): void {
		exportDatabaseSnapshot(this.db, this.dataDir, paintSnapshotConfig);

		this.dirty = false;

		this.logger.log('Paint snapshot exported.');
	}

	/**
	 * Exports the paint snapshot during shutdown when persistent data changed.
	 *
	 * @param signal Optional shutdown signal provided by NestJS.
	 */
	public onApplicationShutdown(signal?: string): void {
		this.logger.log('onApplicationShutdown called');
		if (!this.dirty) {
			this.logger.log('No unsaved changes detected');
			return;
		}

		this.logger.log('Unsaved changes detected. Exporting paint snapshot before shutdown...');
		this.export();
	}
}
