/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';
import {
	PaintBrandRepository,
	PaintRecentSelectionRepository,
	PaintRepository,
	PaintSnapshotService
} from '@application-platform/paint-data-access';
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';

/** Paint payload with nullable alternatives for clients that explicitly clear the field. */
type PaintBody = Omit<Paint, 'matchColor'> & { matchColor?: NonNullable<Paint['matchColor']> | null };

/**
 * Handles HTTP requests for paint brands, paints and recent selections.
 */
@Controller('api')
export class PaintController {
	constructor(
		private readonly paintRepository: PaintRepository,
		private readonly paintBrandRepository: PaintBrandRepository,
		private readonly paintRecentSelectionRepository: PaintRecentSelectionRepository,
		private readonly paintSnapshotService: PaintSnapshotService
	) {}

	/**
	 * Exports the current persistent paint data.
	 */
	@Post('paints/export')
	@HttpCode(HttpStatus.NO_CONTENT)
	public exportPaints(): void {
		this.paintSnapshotService.export();
	}

	/**
	 * Retrieves all available paint brands.
	 *
	 * @returns All paint brand definitions.
	 */
	@Get('paint-brands')
	public getBrands(): PaintBrandDefinition[] {
		return this.paintBrandRepository.findAll();
	}

	/**
	 * Creates a new paint brand.
	 *
	 * @param paintBrandDefinition The paint brand to create.
	 * @returns The created paint brand.
	 */
	@Post('paint-brands')
	public createBrand(@Body() paintBrandDefinition: PaintBrandDefinition): PaintBrandDefinition {
		this.paintBrandRepository.insert(paintBrandDefinition);

		return paintBrandDefinition;
	}

	/**
	 * Updates an existing paint brand.
	 *
	 * @param id The ID of the paint brand to update.
	 * @param brand The updated paint brand data.
	 * @returns The updated paint brand.
	 */
	@Put('paint-brands/:id')
	public updateBrand(@Param('id') id: string, @Body() brand: PaintBrandDefinition): PaintBrandDefinition {
		const updatedBrand: PaintBrandDefinition = {
			...brand,
			id
		};

		this.paintBrandRepository.update(updatedBrand);

		return updatedBrand;
	}

	/**
	 * Deletes a paint brand.
	 *
	 * @param id The ID of the paint brand to delete.
	 */
	@Delete('paint-brands/:id')
	public deleteBrand(@Param('id') id: string): void {
		this.paintBrandRepository.delete(id);
	}

	/**
	 * Retrieves paints, optionally filtered by brand.
	 *
	 * @param brand Optional paint brand ID used to filter the result.
	 * @returns All matching paints.
	 */
	@Get('paints')
	public getPaints(@Query('brand') brand?: string): Paint[] {
		return brand ? this.paintRepository.findByBrand(brand) : this.paintRepository.findAll();
	}

	/**
	 * Creates a new paint.
	 *
	 * @param paint The paint to create.
	 * @returns The created paint.
	 */
	@Post('paints')
	public createPaint(@Body() paint: PaintBody): Paint {
		const createdPaint = this.normalizePaint(paint);
		this.paintRepository.insert(createdPaint);

		return createdPaint;
	}

	/**
	 * Updates an existing paint.
	 *
	 * @param id The ID of the paint to update.
	 * @param paint The updated paint data.
	 * @returns The updated paint.
	 */
	@Put('paints/:id')
	public updatePaint(@Param('id') id: PaintId, @Body() paint: PaintBody): Paint {
		const updatedPaint = this.normalizePaint({
			...paint,
			id
		});

		this.paintRepository.update(updatedPaint);

		return updatedPaint;
	}

	private normalizePaint({ matchColor, ...paint }: PaintBody): Paint {
		if (matchColor === undefined || matchColor === null) {
			return paint;
		}

		if (!Array.isArray(matchColor) || matchColor.some((name) => typeof name !== 'string' || /[\r\n]/.test(name))) {
			throw new BadRequestException('matchColor must contain single-line alternative paint names.');
		}

		const names = [...new Set(matchColor.map((name: string) => name.trim()).filter(Boolean))];
		if (names.some((name) => /^#[0-9a-f]{6}$/i.test(name))) {
			throw new BadRequestException('matchColor must contain alternative paint names.');
		}
		return names.length ? { ...paint, matchColor: names } : paint;
	}

	/**
	 * Deletes a paint.
	 *
	 * @param id The ID of the paint to delete.
	 */
	@Delete('paints/:id')
	public deletePaint(@Param('id') id: PaintId): void {
		this.paintRepository.delete(id);
	}

	/**
	 * Retrieves the IDs of recently selected paints.
	 *
	 * @returns The recently selected paint IDs.
	 */
	@Get('recent')
	public getRecentPaints(): PaintId[] {
		return this.paintRecentSelectionRepository.findRecent();
	}
}
