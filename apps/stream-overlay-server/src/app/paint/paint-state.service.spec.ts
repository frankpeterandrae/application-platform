/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint } from '@application-platform/paint';

import { PaintStateService } from './paint-state.service';

describe('PaintStateService', () => {
	let service: PaintStateService;

	const paint: Paint = {
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		mainColor: '#991115',
		colorGroups: ['red']
	};

	beforeEach(() => {
		service = new PaintStateService();
	});

	it('should initially have no current paint', () => {
		expect(service.getCurrentPaint()).toBeUndefined();
	});

	it('should store the current paint', () => {
		service.setCurrentPaint(paint);

		expect(service.getCurrentPaint()).toEqual(paint);
	});

	it('should replace the current paint', () => {
		const secondPaint: Paint = {
			...paint,
			id: 'citadel:22-01',
			sku: '22-01',
			name: 'Khorne Red',
			mainColor: '#650001'
		};

		service.setCurrentPaint(paint);
		service.setCurrentPaint(secondPaint);

		expect(service.getCurrentPaint()).toEqual(secondPaint);
	});

	it('should clear the current paint', () => {
		service.setCurrentPaint(paint);

		service.clearCurrentPaint();

		expect(service.getCurrentPaint()).toBeUndefined();
	});
});
