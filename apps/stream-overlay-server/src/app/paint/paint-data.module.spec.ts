/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { openDb } from '@application-platform/data-db';
import { PaintBrandRepository, PaintSnapshotService } from '@application-platform/paint-data-access';
import { Test } from '@nestjs/testing';

import { AppModule } from '../app.module';
import { DatabaseService } from '../database/database.service';

describe('Paint snapshot lifecycle', () => {
	it('flushes pending changes before closing the database', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paint-snapshot-lifecycle-'));
		const dataDir = path.join(tempDir, 'snapshot');
		const db = openDb(path.join(tempDir, 'test.db'));

		try {
			db.exec('CREATE TABLE paint_brand (id TEXT PRIMARY KEY, label TEXT NOT NULL)');

			const app = await Test.createTestingModule({ imports: [AppModule] })
				.overrideProvider(DatabaseService)
				.useValue({ db, onApplicationShutdown: () => db.close() })
				.overrideProvider(PaintSnapshotService)
				.useValue(new PaintSnapshotService(db, dataDir))
				.compile();

			await app.init();
			const brand = { id: 'citadel', label: 'Citadel' };
			app.get(PaintBrandRepository).insert(brand);
			await app.close();

			expect(db.open).toBe(false);
			expect(JSON.parse(fs.readFileSync(path.join(dataDir, 'paint_brand.json'), 'utf8'))).toEqual([brand]);
		} finally {
			if (db.open) {
				db.close();
			}
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
