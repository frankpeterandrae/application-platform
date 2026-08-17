/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Db } from '@application-platform/data-db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaintSnapshotService } from './paint-snapshot.service';
const { exportDatabaseSnapshotMock } = vi.hoisted(() => ({
	exportDatabaseSnapshotMock: vi.fn()
}));

vi.mock('@application-platform/data-db', async (importOriginal) => {
	const original = await importOriginal<typeof import('@application-platform/data-db')>();

	return {
		...original,
		exportDatabaseSnapshot: exportDatabaseSnapshotMock
	};
});

vi.mock('node:fs', () => ({
	default: {
		rmSync: vi.fn(),
		mkdirSync: vi.fn(),
		cpSync: vi.fn(),
		writeFileSync: vi.fn()
	}
}));

describe('PaintSnapshotService', () => {
	const dataDir = 'data/paint';

	let db: Db;
	let service: PaintSnapshotService;

	let brandRows: Array<Record<string, unknown>>;
	let paintRows: Array<Record<string, unknown>>;

	beforeEach(() => {
		vi.clearAllMocks();

		brandRows = [];
		paintRows = [];

		db = {
			prepare: vi.fn((sql: string) => {
				if (sql.includes('FROM paint_brand')) {
					return {
						all: vi.fn(() => brandRows)
					};
				}

				if (sql.includes('FROM paint') && !sql.includes('paint_brand')) {
					return {
						all: vi.fn(() => paintRows)
					};
				}

				throw new Error(`Unexpected SQL: ${sql}`);
			})
		} as unknown as Db;

		service = new PaintSnapshotService(db, dataDir);
	});

	it('should not export on shutdown when service is clean', () => {
		const exportSpy = vi.spyOn(service, 'export').mockImplementation(() => undefined);

		service.onApplicationShutdown();

		expect(exportSpy).not.toHaveBeenCalled();
	});

	it('should become clean after successful export', () => {
		service.markDirty();

		service.export();

		service.onApplicationShutdown();

		expect(exportDatabaseSnapshotMock).toHaveBeenCalledTimes(1);
	});

	it('should remain dirty when export fails', () => {
		exportDatabaseSnapshotMock.mockImplementationOnce(() => {
			throw new Error('Export failed');
		});

		service.markDirty();

		expect(() => service.export()).toThrow('Export failed');

		exportDatabaseSnapshotMock.mockReset();

		service.onApplicationShutdown();

		expect(exportDatabaseSnapshotMock).toHaveBeenCalledTimes(1);
	});
});
