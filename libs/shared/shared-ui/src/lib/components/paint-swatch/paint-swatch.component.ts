/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Paint, PaintColorGroup } from '@application-platform/paint';

let nextId = 0;

/**
 * Renders a paint swatch as an SVG paint blob.
 */
@Component({
	selector: 'fpa-shared-ui-paint-swatch',
	standalone: true,
	templateUrl: './paint-swatch.component.html',
	styleUrl: './paint-swatch.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaintSwatchComponent {
	public readonly paint = input<Paint>();
	public readonly color = input<string>();

	private readonly instanceId = createInstanceId();

	protected readonly blobClipId = `${this.instanceId}-blob-clip`;
	protected readonly baseGradientId = `${this.instanceId}-base-gradient`;
	protected readonly technicalTopGradientId = `${this.instanceId}-technical-top-gradient`;

	/**
	 * Paint blob shape.
	 *
	 * The viewBox is 0 0 100 100, so all coordinates are normalized.
	 */
	protected readonly blobPath =
		'M81.62 54.84 ' +
		'C82.72 58.4, 85.39 63.64, 87.01 73.7 ' +
		'S76.86 74.99, 67.01 76.29 ' +
		'S63.78 85.8, 57.18 94.56 ' +
		'S49.52 87.94, 39.42 86.66 ' +
		'S31.05 89.39, 30.91 75.25 ' +
		'S28.9 67.13, 22.32 64.29 ' +
		'S15.13 59.37, 10.48 52.48 ' +
		'S15.23 45.36, 18.83 38.08 ' +
		'S15.5 27.5, 18.53 19.51 ' +
		'S29.06 19.32, 38.64 22.03 ' +
		'S45.52 24.82, 52.2 18.31 ' +
		'S61.52 7.03, 66.98 13.7 ' +
		'S73.97 20.87, 80.34 24.29 ' +
		'S78.7 34.67, 85.47 40.84 ' +
		'S86.81 47, 81.62 54.84 Z';

	protected readonly mainColor = computed(() => this.paint()?.mainColor || (this.color() ?? ''));

	protected readonly secondaryColor = computed(() => this.paint()?.secondaryColor || this.paint()?.mainColor || (this.color() ?? ''));

	protected readonly isTechnical = computed(() => this.paint()?.colorGroups?.includes(PaintColorGroup.Technical));

	protected readonly isMetallic = computed(() => this.paint()?.colorGroups?.includes(PaintColorGroup.Metallic));

	protected readonly isInkOrGlaze = computed(
		() => this.paint()?.colorGroups?.includes(PaintColorGroup.Inks) || this.paint()?.colorGroups?.includes(PaintColorGroup.Glaze)
	);

	protected readonly isWash = computed(() => this.paint()?.colorGroups?.includes(PaintColorGroup.Washes));

	protected readonly baseVariant = computed<'default' | 'metallic' | 'ink-or-glaze' | 'wash'>(() => {
		if (this.isMetallic()) {
			return 'metallic';
		}

		if (this.isInkOrGlaze()) {
			return 'ink-or-glaze';
		}

		if (this.isWash()) {
			return 'wash';
		}

		return 'default';
	});

	protected readonly technicalTopStartColor = computed(() => mixHex(this.secondaryColor(), '#ffffff', 0.35));

	protected readonly technicalTopEndColor = computed(() => this.secondaryColor());
}

/**
 * Mixes two hex colors.
 *
 * @param base Base color.
 * @param mixWith Color to mix with.
 * @param amount Mix amount between 0 and 1.
 * @returns Mixed hex color.
 */
function mixHex(base: string, mixWith: string, amount: number): `#${string}` {
	const a = hexToRgb(base);
	const b = hexToRgb(mixWith);

	const r = Math.round(a.r + (b.r - a.r) * amount);
	const g = Math.round(a.g + (b.g - a.g) * amount);
	const bValue = Math.round(a.b + (b.b - a.b) * amount);

	return rgbToHex(r, g, bValue);
}

/**
 * Converts a hex color into RGB channels.
 *
 * @param hex Hex color value.
 * @returns RGB channels.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const normalized = hex.replace('#', '');
	const expanded =
		normalized.length === 3
			? normalized
					.split('')
					.map((char) => `${char}${char}`)
					.join('')
			: normalized;

	return {
		r: Number.parseInt(expanded.slice(0, 2), 16),
		g: Number.parseInt(expanded.slice(2, 4), 16),
		b: Number.parseInt(expanded.slice(4, 6), 16)
	};
}

/**
 * Converts RGB channels to a hex color.
 *
 * @param r Red channel.
 * @param g Green channel.
 * @param b Blue channel.
 * @returns Hex color.
 */
function rgbToHex(r: number, g: number, b: number): `#${string}` {
	return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}` as `#${string}`;
}

/**
 * Increse the id of the current paint swatch
 */
function createInstanceId(): string {
	nextId += 1;

	return `paint-swatch-${nextId}`;
}
