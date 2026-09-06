/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint, PaintBrandDefinition, PaintId } from '@application-platform/paint';
import { PaintBrandRepository, PaintRecentSelectionRepository, PaintRepository } from '@application-platform/paint-data-access';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';

/**
 * Handles HTTP requests for paint brands, paints and recent selections.
 */
@Controller('api')
export class PaintController {
	constructor(
		private readonly paintRepository: PaintRepository,
		private readonly paintBrandRepository: PaintBrandRepository,
		private readonly paintRecentSelectionRepository: PaintRecentSelectionRepository
	) {}

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
	public createPaint(@Body() paint: Paint): Paint {
		this.paintRepository.insert(paint);

		return paint;
	}

	/**
	 * Updates an existing paint.
	 *
	 * @param id The ID of the paint to update.
	 * @param paint The updated paint data.
	 * @returns The updated paint.
	 */
	@Put('paints/:id')
	public updatePaint(@Param('id') id: PaintId, @Body() paint: Paint): Paint {
		const updatedPaint: Paint = {
			...paint,
			id
		};

		this.paintRepository.update(updatedPaint);

		return updatedPaint;
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
