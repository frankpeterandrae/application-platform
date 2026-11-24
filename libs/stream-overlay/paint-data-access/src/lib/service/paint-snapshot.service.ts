/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { type Db, exportDatabaseSnapshot } from '@application-platform/data-db';
import { type OnApplicationShutdown, Logger } from '@nestjs/common';

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
		try {
			exportDatabaseSnapshot(this.db, this.dataDir, paintSnapshotConfig);
		} catch (error) {
			this.dirty = true;
			this.logger.error('Paint snapshot export failed.', error);
			throw error;
		}

		this.dirty = false;

		this.logger.log('Paint snapshot exported.');
	}

	/**
	 * Exports the paint snapshot during shutdown when persistent data changed.
	 */
	public onApplicationShutdown(): void {
		if (!this.dirty) {
			return;
		}

		this.logger.log('Exporting pending paint changes during shutdown.');
		try {
			this.export();
		} catch {
			// export() logged the failure. Let the remaining shutdown hooks run.
		}
	}
}
