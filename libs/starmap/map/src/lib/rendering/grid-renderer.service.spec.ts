/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../test-setup';

import { GridRendererService } from './grid-renderer.service';

describe('GridRendererService', () => {
	let service: GridRendererService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(GridRendererService);
	});

	it('should render horizontal and vertical grid lines', () => {
		const group = service.render({
			bounds: {
				minX: 0,
				maxX: 1,
				minY: 0,
				maxY: 1,
				minZ: 0,
				maxZ: 0
			},
			width: 450,
			height: 450,
			xGridLines: [75, 225, 375],
			yGridLines: [75, 225, 375]
		});

		const lines = group.querySelectorAll('line');

		expect(group.id).toBe('grid');
		expect(lines).toHaveLength(6);

		expect(lines[0].getAttribute('x1')).toBe('75');
		expect(lines[0].getAttribute('x2')).toBe('75');

		expect(lines[3].getAttribute('y1')).toBe('75');
		expect(lines[3].getAttribute('y2')).toBe('75');
	});
});
