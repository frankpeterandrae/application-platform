/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { AxisRendererService } from './axis-renderer.service';

describe('AxisRendererService', () => {
	let service: AxisRendererService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(AxisRendererService);
	});

	it('should render coordinate labels for both axes', () => {
		const group = service.render({
			bounds: {
				minX: -1,
				maxX: 1,
				minY: -2,
				maxY: 0,
				minZ: 0,
				maxZ: 0
			},
			width: 600,
			height: 600,
			xGridLines: [],
			yGridLines: []
		});

		const labels = [...group.querySelectorAll('text')];

		expect(group.id).toBe('axis-labels');
		expect(labels).toHaveLength(6);

		expect(labels.map((label) => label.textContent)).toEqual(['-1', '0', '1', '-2', '-1', '0']);
	});
});
