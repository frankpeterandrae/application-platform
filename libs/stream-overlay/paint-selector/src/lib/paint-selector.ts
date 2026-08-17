/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Paint, PaintBrandDefinition, PaintColorGroupDefinition, paintColorGroups, PaintId } from '@application-platform/paint';

import { PaintSelectorAction } from './model/paint-selector-action';
import { PaintSelectorButton } from './model/paint-selector-button';
import { PaintSelectorConfig } from './model/paint-selector-config';
import { PaintSelectorFilter } from './model/paint-selector-filter';
import { PaintSelectorSlot } from './model/paint-selector-slot';
import { PaintSelectorView } from './model/paint-selector-view';
import {
	PAINT_SELECTOR_BACK_SLOT,
	PAINT_SELECTOR_CLEAR_SLOT,
	PAINT_SELECTOR_HOME_SLOT,
	PAINT_SELECTOR_NEXT_SLOT,
	PAINT_SELECTOR_RECENT_COUNT,
	PAINT_SELECTOR_SLOT_COUNT
} from './paint-selector.constants';

/**
 * Provides the platform-independent navigation logic for selecting paints
 * on a fixed 8x4 button grid.
 */
export class PaintSelector {
	private paints: readonly Paint[];
	private brands: readonly PaintBrandDefinition[];
	private recentPaintIds: readonly PaintId[];

	private view: PaintSelectorView = {
		type: 'home',
		page: 0
	};

	constructor(config: PaintSelectorConfig) {
		this.paints = config.paints;
		this.brands = config.brands;
		this.recentPaintIds = config.recentPaintIds ?? [];
	}

	/**
	 * Returns the current 32 button slots.
	 */
	public get slots(): PaintSelectorSlot[] {
		switch (this.view.type) {
			case 'home':
				return this.createHomeSlots();

			case 'brand':
				return this.createBrandSlots(this.view);
			case 'paints':
				return this.createPaintSlots(this.view);
			default:
				return [];
		}
	}

	/**
	 * Updates the available paints.
	 */
	public updatePaints(paints: readonly Paint[]): void {
		this.paints = paints;
	}

	/**
	 * Updates the available paint brands.
	 */
	public updateBrands(brands: readonly PaintBrandDefinition[]): void {
		this.brands = brands;
	}

	/**
	 * Updates the recent paint IDs.
	 */
	public updateRecentPaints(paintIds: readonly PaintId[]): void {
		this.recentPaintIds = paintIds.slice(0, PAINT_SELECTOR_RECENT_COUNT);
	}

	/**
	 * Handles a button press.
	 */
	public press(index: number): PaintSelectorAction {
		const slot = this.slots[index];

		if (!slot) {
			return {
				type: 'none'
			};
		}

		switch (slot.button.type) {
			case 'paint':
				return this.selectPaint(slot.button.paint);

			case 'brand':
				this.view = {
					type: 'brand',
					brand: slot.button.brand.id,
					page: 0
				};

				return {
					type: 'none'
				};

			case 'home':
				return this.goHome();

			case 'back':
				this.goBack();

				return {
					type: 'none'
				};

			case 'next':
				this.goNext();

				return {
					type: 'none'
				};

			case 'empty':
				return {
					type: 'none'
				};

			case 'color':
				this.openPaints({
					type: 'color',
					value: slot.button.value
				});

				return {
					type: 'none'
				};

			case 'category':
				this.openPaints({
					type: 'category',
					value: slot.button.value
				});

				return {
					type: 'none'
				};
			case 'clear':
				return {
					type: 'clear'
				};
		}
	}

	private selectPaint(paint: Paint): PaintSelectorAction {
		this.view = {
			type: 'home',
			page: 0
		};

		return {
			type: 'paint-selected',
			paint
		};
	}

	private goHome(): PaintSelectorAction {
		if (this.view.type === 'home') {
			return {
				type: 'home'
			};
		}

		this.view = {
			type: 'home',
			page: 0
		};

		return {
			type: 'none'
		};
	}

	private goBack(): void {
		switch (this.view.type) {
			case 'home':
				if (this.view.page > 0) {
					this.view = {
						...this.view,
						page: this.view.page - 1
					};
				}

				break;

			case 'brand':
				if (this.view.page > 0) {
					this.view = {
						...this.view,
						page: this.view.page - 1
					};
				} else {
					this.view = {
						type: 'home',
						page: 0
					};
				}

				break;

			case 'paints':
				if (this.view.page > 0) {
					this.view = {
						...this.view,
						page: this.view.page - 1
					};
				} else {
					this.view = {
						type: 'brand',
						brand: this.view.brand,
						page: 0
					};
				}

				break;
		}
	}

	private goNext(): void {
		this.view = {
			...this.view,
			page: this.view.page + 1
		};
	}

	private createHomeSlots(): PaintSelectorSlot[] {
		const slots = this.createEmptySlots();

		if (this.view.page === 0) {
			this.setRecentPaints(slots);
			this.setFirstBrandPage(slots);
		} else {
			this.setAdditionalBrandPage(slots);
		}

		this.setNavigation(slots, this.hasNextHomePage());

		return slots;
	}

	private setRecentPaints(slots: PaintSelectorSlot[]): void {
		const paintsById = new Map(this.paints.map((paint) => [paint.id, paint]));

		const recentPaints = this.recentPaintIds
			.map((id) => paintsById.get(id))
			.filter((paint): paint is Paint => paint !== undefined)
			.slice(0, PAINT_SELECTOR_RECENT_COUNT);

		recentPaints.forEach((paint, index) => {
			slots[index] = this.createPaintSlot(index, paint);
		});
	}

	private setFirstBrandPage(slots: PaintSelectorSlot[]): void {
		const brands = this.brands.slice(0, 16);

		brands.forEach((brand, offset) => {
			const index = 8 + offset;

			slots[index] = this.createBrandSlot(index, brand);
		});
	}

	private setAdditionalBrandPage(slots: PaintSelectorSlot[]): void {
		const start = 16 + (this.view.page - 1) * 24;

		const brands = this.brands.slice(start, start + 24);

		brands.forEach((brand, index) => {
			slots[index] = this.createBrandSlot(index, brand);
		});
	}

	private createBrandSlots(view: Extract<PaintSelectorView, { type: 'brand' }>): PaintSelectorSlot[] {
		const slots = this.createEmptySlots();

		const paints = this.paints.filter((paint) => paint.brand === view.brand);

		const colorGroups = this.getAvailableColorGroups(paints);

		const categories = this.getDistinctValues(paints.map((paint) => paint.category));

		const start = view.page * 8;

		colorGroups.slice(start, start + 16).forEach((group, index) => {
			slots[index] = {
				index,
				button: {
					type: 'color',
					label: group.label,
					color: group.color,
					value: group.id
				}
			};
		});

		categories.slice(start, start + 8).forEach((category, offset) => {
			const index = 16 + offset;

			slots[index] = {
				index,
				button: {
					type: 'category',
					label: category,
					value: category
				}
			};
		});

		const hasNext = start + 8 < colorGroups.length || start + 8 < categories.length;

		this.setNavigation(slots, hasNext);
		return slots;
	}

	/**
	 * Returns the color groups that are actually used by the provided paints.
	 */
	private getAvailableColorGroups(paints: readonly Paint[]): PaintColorGroupDefinition[] {
		const availableGroups = new Set(paints.flatMap((paint) => paint.colorGroups));

		return paintColorGroups.filter((group) => availableGroups.has(group.id));
	}

	private getDistinctValues(values: readonly (string | undefined)[]): string[] {
		return [...new Set(values.filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b));
	}

	private createPaintSlots(view: Extract<PaintSelectorView, { type: 'paints' }>): PaintSelectorSlot[] {
		const slots = this.createEmptySlots();

		const paints = this.paints.filter((paint) => paint.brand === view.brand && this.matchesFilter(paint, view.filter));

		const start = view.page * 24;

		paints.slice(start, start + 24).forEach((paint, index) => {
			slots[index] = this.createPaintSlot(index, paint);
		});

		this.setNavigation(slots, start + 24 < paints.length);

		return slots;
	}

	private matchesFilter(paint: Paint, filter: PaintSelectorFilter): boolean {
		switch (filter.type) {
			case 'color':
				return paint.colorGroups.includes(filter.value);
			case 'category':
				return paint.category === filter.value;
		}
	}

	/**
	 * Configures the fixed navigation slots for the current selector view.
	 *
	 * @param slots The slots to update.
	 * @param hasNext Whether the next-page button should be shown.
	 */
	private setNavigation(slots: PaintSelectorSlot[], hasNext: boolean): void {
		slots[PAINT_SELECTOR_HOME_SLOT] = {
			index: PAINT_SELECTOR_HOME_SLOT,
			button: {
				type: 'home',
				label: 'Home'
			}
		};

		if (this.view.type === 'home') {
			slots[PAINT_SELECTOR_CLEAR_SLOT] = {
				index: PAINT_SELECTOR_CLEAR_SLOT,
				button: {
					type: 'clear',
					label: 'Clear'
				}
			};
		}

		if (this.view.type !== 'home' || this.view.page > 0) {
			slots[PAINT_SELECTOR_BACK_SLOT] = {
				index: PAINT_SELECTOR_BACK_SLOT,
				button: {
					type: 'back',
					label: 'Zurück'
				}
			};
		}

		if (hasNext) {
			slots[PAINT_SELECTOR_NEXT_SLOT] = {
				index: PAINT_SELECTOR_NEXT_SLOT,
				button: {
					type: 'next',
					label: 'Weiter'
				}
			};
		}
	}

	private hasNextHomePage(): boolean {
		if (this.view.type !== 'home') {
			return false;
		}

		if (this.view.page === 0) {
			return this.brands.length > 16;
		}

		const end = 16 + this.view.page * 24;

		return end < this.brands.length;
	}

	private createPaintSlot(index: number, paint: Paint): PaintSelectorSlot {
		return {
			index,
			button: {
				type: 'paint',
				label: paint.name,
				color: paint.mainColor,
				paint
			}
		};
	}

	private createBrandSlot(index: number, brand: PaintBrandDefinition): PaintSelectorSlot {
		return {
			index,
			button: {
				type: 'brand',
				label: brand.label,
				brand
			}
		};
	}

	private createEmptySlots(): PaintSelectorSlot[] {
		return Array.from(
			{
				length: PAINT_SELECTOR_SLOT_COUNT
			},
			(_, index) => ({
				index,
				button: {
					type: 'empty'
				} satisfies PaintSelectorButton
			})
		);
	}

	private openPaints(filter: PaintSelectorFilter): void {
		if (this.view.type !== 'brand') {
			return;
		}

		this.view = {
			type: 'paints',
			brand: this.view.brand,
			filter,
			page: 0
		};
	}
}
