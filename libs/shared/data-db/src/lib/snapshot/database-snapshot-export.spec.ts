/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { type Db, openDb } from '../db';

import { exportDatabaseSnapshot } from './database-snapshot-export';

describe('exportDatabaseSnapshot', () => {
	let tempDir: string;
	let dataDir: string;
	let dbPath: string;
	let db: Db;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'database-snapshot-'));

		dataDir = path.join(tempDir, 'snapshot');
		dbPath = path.join(tempDir, 'test.db');

		db = openDb(dbPath);

		db.exec(`
		CREATE TABLE paint_brand (
			id TEXT PRIMARY KEY,
			label TEXT NOT NULL
		);

		CREATE TABLE paint (
			id TEXT PRIMARY KEY,
			brand_id TEXT NOT NULL,
			sku TEXT NOT NULL,
			name TEXT NOT NULL,
			FOREIGN KEY (brand_id) REFERENCES paint_brand(id)
		);

		CREATE TABLE other_table (
			id TEXT PRIMARY KEY
		);
	`);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		db.close();

		fs.rmSync(tempDir, {
			recursive: true,
			force: true
		});
	});

	it('should export every table matching the configured prefix', () => {
		db.prepare(
			`
		INSERT INTO paint_brand (id, label)
		VALUES (?, ?)
	`
		).run('citadel', 'Citadel');

		exportDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint'
		});

		expect(JSON.parse(fs.readFileSync(path.join(dataDir, 'paint_brand.json'), 'utf8'))).toEqual([
			{
				id: 'citadel',
				label: 'Citadel'
			}
		]);

		expect(fs.existsSync(path.join(dataDir, 'other_table.json'))).toBe(false);
	});

	it('should exclude explicitly disabled tables', () => {
		exportDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint',
			tables: {
				paint_recent_selection: {
					export: false
				}
			}
		});

		expect(fs.existsSync(path.join(dataDir, 'paint_recent_selection.json'))).toBe(false);
	});

	it('should group configured tables into separate files', () => {
		db.prepare(
			`
		INSERT INTO paint_brand (id, label)
		VALUES (?, ?)
	`
		).run('citadel', 'Citadel');

		db.prepare(
			`
		INSERT INTO paint (id, brand_id, sku, name)
		VALUES (?, ?, ?, ?)
	`
		).run('citadel:1', 'citadel', '1', 'Abaddon Black');

		exportDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint',
			tables: {
				paint: {
					groupBy: 'brand_id'
				}
			}
		});

		expect(fs.existsSync(path.join(dataDir, 'paint', 'citadel.json'))).toBe(true);
	});

	it('should replace files from an older snapshot', () => {
		fs.mkdirSync(dataDir, { recursive: true });
		fs.writeFileSync(path.join(dataDir, 'obsolete.json'), '[]');

		exportDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint'
		});

		expect(fs.existsSync(path.join(dataDir, 'obsolete.json'))).toBe(false);
		expect(fs.readdirSync(tempDir).filter((entry) => entry.startsWith('snapshot.__staging-'))).toEqual([]);
	});

	it('should preserve the existing snapshot when writing staging fails', () => {
		exportDatabaseSnapshot(db, dataDir, { tablePrefix: 'paint' });
		const existingFiles = fs.readdirSync(tempDir);
		db.prepare('INSERT INTO paint_brand (id, label) VALUES (?, ?)').run('citadel', 'Citadel');

		expect(() =>
			exportDatabaseSnapshot(db, dataDir, {
				tablePrefix: 'paint',
				tables: { paint_brand: { groupBy: 'missing_column' } }
			})
		).toThrow('invalid value for grouping column');

		expect(fs.readFileSync(path.join(dataDir, 'paint_brand.json'), 'utf8')).toBe('[]\n');
		expect(fs.readdirSync(tempDir)).toEqual(existingFiles);
	});

	it('should retain the completed snapshot and report the cause when publication fails', () => {
		exportDatabaseSnapshot(db, dataDir, { tablePrefix: 'paint' });
		const renameError = new Error('Destination is locked');
		const rename = vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
			throw renameError;
		});

		expect(() => exportDatabaseSnapshot(db, dataDir, { tablePrefix: 'paint' })).toThrow(
			expect.objectContaining({ message: expect.stringContaining('Could not replace snapshot'), cause: renameError })
		);

		const [stagingDir, target] = rename.mock.calls[0];
		expect(target).toBe(dataDir);
		expect(fs.readFileSync(path.join(String(stagingDir), 'paint_brand.json'), 'utf8')).toBe('[]\n');
		expect(fs.existsSync(dataDir)).toBe(false);

		exportDatabaseSnapshot(db, dataDir, { tablePrefix: 'paint' });
		expect(fs.existsSync(path.join(dataDir, 'paint_brand.json'))).toBe(true);
	});

	it('should retain the staged snapshot when removing the existing target fails', () => {
		exportDatabaseSnapshot(db, dataDir, { tablePrefix: 'paint' });
		const removeError = new Error('Existing snapshot is locked');
		vi.spyOn(fs, 'rmSync').mockImplementationOnce(() => {
			throw removeError;
		});
		const rename = vi.spyOn(fs, 'renameSync');

		expect(() => exportDatabaseSnapshot(db, dataDir, { tablePrefix: 'paint' })).toThrow(
			expect.objectContaining({ message: expect.stringContaining('Could not replace snapshot'), cause: removeError })
		);

		expect(rename).not.toHaveBeenCalled();
		expect(fs.existsSync(path.join(dataDir, 'paint_brand.json'))).toBe(true);
		const stagedFiles = fs.readdirSync(tempDir).filter((entry) => entry.startsWith('snapshot.__staging-'));
		expect(stagedFiles).toHaveLength(1);
		expect(fs.existsSync(path.join(tempDir, stagedFiles[0], 'paint_brand.json'))).toBe(true);
	});
});
