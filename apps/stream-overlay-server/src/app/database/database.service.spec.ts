/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { openDb } from '@application-platform/data-db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseService } from './database.service';

vi.mock('@application-platform/data-db', () => ({
	openDb: vi.fn()
}));

describe('DatabaseService', () => {
	const db = {
		close: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env['DB_PATH'];

		vi.mocked(openDb).mockReturnValue(db as never);
	});

	afterEach(() => {
		delete process.env['DB_PATH'];
	});

	it('should use DB_PATH when configured', () => {
		process.env['DB_PATH'] = 'custom/database.db';

		const service = new DatabaseService();

		expect(openDb).toHaveBeenCalledWith('custom/database.db');

		expect(service.db).toBe(db);
	});

	it('should use default database path', () => {
		const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/workspace');

		new DatabaseService();

		expect(openDb).toHaveBeenCalledWith(expect.stringMatching(/[\\/]workspace[\\/]data[\\/]stream-overlay\.db$/));

		cwdSpy.mockRestore();
	});

	it('should close database on application shutdown', () => {
		const service = new DatabaseService();

		service.onApplicationShutdown();

		expect(db.close).toHaveBeenCalledTimes(1);
	});
});
