/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Db, openDb } from '../db';

import { importDatabaseSnapshot } from './database-snapshot-import';

describe('importDatabaseSnapshot', () => {
	let tempDir: string;
	let dataDir: string;
	let dbPath: string;
	let db: Db;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'database-snapshot-'));

		dataDir = path.join(tempDir, 'snapshot');
		dbPath = path.join(tempDir, 'test.db');

		fs.mkdirSync(dataDir, {
			recursive: true
		});

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

		CREATE TABLE paint_recent_selection (
			id TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);
	});

	afterEach(() => {
		db.close();

		fs.rmSync(tempDir, {
			recursive: true,
			force: true
		});
	});

	it('should import matching snapshot tables', () => {
		writeJson(path.join(dataDir, 'paint_brand.json'), [
			{
				id: 'citadel',
				label: 'Citadel'
			}
		]);

		importDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint'
		});

		expect(db.prepare('SELECT * FROM paint_brand').all()).toEqual([
			{
				id: 'citadel',
				label: 'Citadel'
			}
		]);
	});

	it('should leave a table unchanged when no snapshot exists', () => {
		db.prepare(
			`
				INSERT INTO paint_brand
					(id, label)
				VALUES
					('existing', 'Existing')
			`
		).run();

		importDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint'
		});

		expect(db.prepare('SELECT * FROM paint_brand').all()).toEqual([
			{
				id: 'existing',
				label: 'Existing'
			}
		]);
	});

	it('should ignore excluded tables', () => {
		db.prepare(
			`
		INSERT INTO paint_recent_selection (id, value)
		VALUES (?, ?)
	`
		).run('1', 'existing');

		writeJson(path.join(dataDir, 'paint_recent_selection.json'), [
			{
				id: '1',
				value: 'snapshot'
			}
		]);

		importDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint',
			tables: {
				paint_recent_selection: {
					import: false
				}
			}
		});

		expect(db.prepare('SELECT * FROM paint_recent_selection').all()).toEqual([
			{
				id: '1',
				value: 'existing'
			}
		]);
	});

	it('should import grouped tables', () => {
		db.prepare(
			`
			INSERT INTO paint_brand (id, label)
			VALUES (?, ?)
		`
		).run('citadel', 'Citadel');

		writeJson(path.join(dataDir, 'paint', 'citadel.json'), [
			{
				id: 'citadel:01',
				brand_id: 'citadel',
				sku: '01',
				name: 'Abaddon Black'
			}
		]);

		importDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint',
			tables: {
				paint: {
					groupBy: 'brand_id'
				}
			}
		});

		expect(db.prepare('SELECT * FROM paint').all()).toEqual([
			{
				id: 'citadel:01',
				brand_id: 'citadel',
				sku: '01',
				name: 'Abaddon Black'
			}
		]);
	});

	it('should reject unknown columns before modifying the database', () => {
		db.prepare(
			`
		INSERT INTO paint_brand (id, label)
		VALUES (?, ?)
	`
		).run('existing', 'Existing');

		writeJson(path.join(dataDir, 'paint_brand.json'), [
			{
				id: 'citadel',
				label: 'Citadel',
				does_not_exist: 'broken'
			}
		]);

		expect(() =>
			importDatabaseSnapshot(db, dataDir, {
				tablePrefix: 'paint'
			})
		).toThrow('Unknown column "does_not_exist"');

		expect(db.prepare('SELECT * FROM paint_brand').all()).toEqual([
			{
				id: 'existing',
				label: 'Existing'
			}
		]);
	});

	it('should import tables with foreign-key dependencies without requiring table order', () => {
		writeJson(path.join(dataDir, 'paint.json'), [
			{
				id: 'citadel:01',
				brand_id: 'citadel',
				sku: '01',
				name: 'Abaddon Black'
			}
		]);

		writeJson(path.join(dataDir, 'paint_brand.json'), [
			{
				id: 'citadel',
				label: 'Citadel'
			}
		]);

		importDatabaseSnapshot(db, dataDir, {
			tablePrefix: 'paint'
		});

		expect(db.pragma('foreign_key_check')).toEqual([]);

		expect(db.prepare('SELECT * FROM paint').all()).toEqual([
			{
				id: 'citadel:01',
				brand_id: 'citadel',
				sku: '01',
				name: 'Abaddon Black'
			}
		]);
	});

	it('should fail when imported data violates a foreign key', () => {
		writeJson(path.join(dataDir, 'paint.json'), [
			{
				id: 'unknown:01',
				brand_id: 'unknown',
				sku: '01',
				name: 'Broken Paint'
			}
		]);

		expect(() =>
			importDatabaseSnapshot(db, dataDir, {
				tablePrefix: 'paint'
			})
		).toThrow('Foreign key validation failed after snapshot import.');
	});

	function writeJson(file: string, data: unknown): void {
		fs.mkdirSync(path.dirname(file), {
			recursive: true
		});

		fs.writeFileSync(file, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
	}
});
