/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { SystemLabelBounds, SystemLabelCollisionService } from './system-label-collision.service';

describe('SystemLabelCollisionService', () => {
	let service: SystemLabelCollisionService;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [SystemLabelCollisionService]
		});

		service = TestBed.inject(SystemLabelCollisionService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should keep non-overlapping labels', () => {
		const labels: SystemLabelBounds[] = [createBounds('S001', 0, 0, 100, 20), createBounds('S002', 150, 0, 250, 20)];

		const result = service.getVisibleSystemIds(labels, 0);

		expect(result).toEqual(new Set(['S001', 'S002']));
	});

	it('should hide a lower-priority overlapping label', () => {
		const labels: SystemLabelBounds[] = [createBounds('S001', 0, 0, 100, 20), createBounds('S002', 50, 0, 150, 20)];

		const result = service.getVisibleSystemIds(labels, 0);

		expect(result).toEqual(new Set(['S001']));
	});

	it('should preserve priority order when several labels overlap', () => {
		const labels: SystemLabelBounds[] = [
			createBounds('S001', 0, 0, 100, 20),
			createBounds('S002', 25, 0, 125, 20),
			createBounds('S003', 50, 0, 150, 20)
		];

		const result = service.getVisibleSystemIds(labels, 0);

		expect(result).toEqual(new Set(['S001']));
	});

	it('should respect the configured gap between labels', () => {
		const labels: SystemLabelBounds[] = [createBounds('S001', 0, 0, 100, 20), createBounds('S002', 103, 0, 203, 20)];

		expect(service.getVisibleSystemIds(labels, 0)).toEqual(new Set(['S001', 'S002']));

		expect(service.getVisibleSystemIds(labels, 4)).toEqual(new Set(['S001']));
	});

	it('should return an empty set when no labels are provided', () => {
		expect(service.getVisibleSystemIds([]).size).toBe(0);
	});

	function createBounds(systemId: string, left: number, top: number, right: number, bottom: number): SystemLabelBounds {
		return {
			systemId,
			left,
			top,
			right,
			bottom
		};
	}
});
