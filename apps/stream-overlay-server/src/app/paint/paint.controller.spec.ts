/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';
import type {
	PaintBrandRepository,
	PaintRecentSelectionRepository,
	PaintRepository,
	PaintSnapshotService
} from '@application-platform/paint-data-access';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaintController } from './paint.controller';

describe('PaintController', () => {
	let controller: PaintController;

	const paintRepository = {
		findAll: vi.fn(),
		findByBrand: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	};

	const paintBrandRepository = {
		findAll: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn()
	};

	const paintRecentSelectionRepository = {
		findRecent: vi.fn()
	};

	const paintSnapshotService = { export: vi.fn() };

	const brand: PaintBrandDefinition = {
		id: 'citadel',
		label: 'Citadel'
	};

	const paint: Paint = {
		id: 'citadel:21-03',
		brand: 'citadel',
		sku: '21-03',
		name: 'Mephiston Red',
		mainColor: '#991115',
		matchColor: ['Word Bearers Red (GW)'],
		colorGroups: ['red']
	};

	beforeEach(() => {
		vi.clearAllMocks();

		controller = new PaintController(
			paintRepository as unknown as PaintRepository,
			paintBrandRepository as unknown as PaintBrandRepository,
			paintRecentSelectionRepository as unknown as PaintRecentSelectionRepository,
			paintSnapshotService as unknown as PaintSnapshotService
		);
	});

	it('should export the current paint snapshot', () => {
		controller.exportPaints();

		expect(paintSnapshotService.export).toHaveBeenCalledTimes(1);
	});

	describe('brands', () => {
		it('should return all brands', () => {
			paintBrandRepository.findAll.mockReturnValue([brand]);

			expect(controller.getBrands()).toEqual([brand]);

			expect(paintBrandRepository.findAll).toHaveBeenCalledTimes(1);
		});

		it('should create a brand', () => {
			const result = controller.createBrand(brand);

			expect(paintBrandRepository.insert).toHaveBeenCalledWith(brand);

			expect(result).toEqual(brand);
		});

		it('should use route id when updating a brand', () => {
			const body: PaintBrandDefinition = {
				id: 'wrong-id',
				label: 'Updated Citadel'
			};

			const result = controller.updateBrand('citadel', body);

			const expected: PaintBrandDefinition = {
				id: 'citadel',
				label: 'Updated Citadel'
			};

			expect(paintBrandRepository.update).toHaveBeenCalledWith(expected);

			expect(result).toEqual(expected);
		});

		it('should delete a brand', () => {
			controller.deleteBrand('citadel');

			expect(paintBrandRepository.delete).toHaveBeenCalledWith('citadel');
		});
	});

	describe('paints', () => {
		it('should return all paints without brand filter', () => {
			paintRepository.findAll.mockReturnValue([paint]);

			expect(controller.getPaints()).toEqual([paint]);

			expect(paintRepository.findAll).toHaveBeenCalledTimes(1);

			expect(paintRepository.findByBrand).not.toHaveBeenCalled();
		});

		it('should return paints filtered by brand', () => {
			paintRepository.findByBrand.mockReturnValue([paint]);

			expect(controller.getPaints('citadel')).toEqual([paint]);

			expect(paintRepository.findByBrand).toHaveBeenCalledWith('citadel');

			expect(paintRepository.findAll).not.toHaveBeenCalled();
		});

		it('should create a paint', () => {
			const result = controller.createPaint(paint);

			expect(paintRepository.insert).toHaveBeenCalledWith(paint);

			expect(result).toEqual(paint);
		});

		it('should use route id when updating a paint', () => {
			const body: Paint = {
				...paint,
				id: 'citadel:wrong'
			};

			const id: PaintId = 'citadel:21-03';

			const result = controller.updatePaint(id, body);

			const expected: Paint = {
				...body,
				id
			};

			expect(paintRepository.update).toHaveBeenCalledWith(expected);

			expect(result).toEqual(expected);
		});

		it('should delete a paint', () => {
			controller.deletePaint('citadel:21-03');

			expect(paintRepository.delete).toHaveBeenCalledWith('citadel:21-03');
		});

		it.each([[[]], [[' ']], [null], [undefined]] as const)('should clear an empty match color (%s)', (matchColor) => {
			const result = controller.updatePaint(paint.id, { ...paint, matchColor });

			expect(result).not.toHaveProperty('matchColor');
			expect(paintRepository.update).toHaveBeenCalledWith(result);
		});

		it('should normalize blanks, whitespace and duplicate alternative names', () => {
			const result = controller.updatePaint(paint.id, {
				...paint,
				matchColor: [' Word Bearers Red (GW) ', '', 'Word Bearers Red (GW)']
			});
			expect(result).toEqual(paint);
			expect(paintRepository.update).toHaveBeenCalledWith(paint);
		});

		it.each([['#112233'], [['#112233']], [[17]], [['Word Bearers\nRed']]])(
			'should reject invalid alternatives before writing (%s)',
			(matchColor) => {
				const invalidPaint = { ...paint, matchColor } as unknown as Paint;

				expect(() => controller.createPaint(invalidPaint)).toThrow('matchColor');
				expect(() => controller.updatePaint(paint.id, invalidPaint)).toThrow('matchColor');
				expect(paintRepository.insert).not.toHaveBeenCalled();
				expect(paintRepository.update).not.toHaveBeenCalled();
			}
		);
	});

	it('should return recent paint ids', () => {
		const recent: PaintId[] = ['citadel:21-03', 'citadel:22-01'];

		paintRecentSelectionRepository.findRecent.mockReturnValue(recent);

		expect(controller.getRecentPaints()).toEqual(recent);

		expect(paintRecentSelectionRepository.findRecent).toHaveBeenCalledTimes(1);
	});
});
