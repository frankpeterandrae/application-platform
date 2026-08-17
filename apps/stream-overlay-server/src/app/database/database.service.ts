/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import path from 'node:path';

import { Db, openDb } from '@application-platform/data-db';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';

/**
 * Provides access to the stream overlay database and manages its lifecycle.
 */
@Injectable()
export class DatabaseService implements OnApplicationShutdown {
	public readonly db: Db;

	constructor() {
		const dbPath = process.env['DB_PATH'] ?? path.join(process.cwd(), 'data', 'stream-overlay.db');

		this.db = openDb(dbPath);
	}

	/**
	 * Closes the database connection during application shutdown.
	 */
	public onApplicationShutdown(): void {
		this.db.close();
	}
}
