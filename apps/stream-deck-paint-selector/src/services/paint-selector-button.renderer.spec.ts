/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { PaintSelectorButton } from '@application-platform/paint-selector';

import { PaintSelectorButtonRenderer } from './paint-selector-button.renderer';

describe('PaintSelectorButtonRenderer', () => {
	let renderer: PaintSelectorButtonRenderer;

	beforeEach(() => {
		renderer = new PaintSelectorButtonRenderer();
	});

	it('should render an empty button', () => {
		const button: PaintSelectorButton = {
			type: 'empty'
		};

		const result = renderer.render(button);

		expect(result.image).toContain('data:image/svg+xml');
	});

	it('should render a paint using its color', () => {
		const button = {
			type: 'paint',
			label: 'Mephiston Red',
			color: '#960c09'
		} as unknown as PaintSelectorButton;

		const result = renderer.render(button);

		const svg = decodeSvg(result.image);

		expect(svg).toContain('#960c09');
		expect(svg).toContain('Mephiston');
	});

	it('should escape XML in labels', () => {
		const button = {
			type: 'category',
			label: 'A & B < C',
			value: 'test'
		} satisfies PaintSelectorButton;

		const result = renderer.render(button);

		const svg = decodeSvg(result.image);

		expect(svg).toContain('A &amp; B &lt; C');
	});

	it('should render a default button', () => {
		const button = {
			type: 'home',
			label: 'Home'
		} satisfies PaintSelectorButton;

		const result = renderer.render(button);

		const svg = decodeSvg(result.image);

		expect(svg).toContain('#151515');
		expect(svg).toContain('Home');
	});

	it('should split long labels into two lines', () => {
		const button = {
			type: 'category',
			label: 'Mephiston Red',
			value: 'test'
		} satisfies PaintSelectorButton;

		const result = renderer.render(button);

		const svg = decodeSvg(result.image);

		expect(svg).toContain('Mephiston');
		expect(svg).toContain('Red');
		expect(svg).toContain('y="64"');
		expect(svg).toContain('y="94"');
	});

	it('should keep a long single word on the first line', () => {
		const button = {
			type: 'category',
			label: 'UltramarinesBlue',
			value: 'test'
		} satisfies PaintSelectorButton;

		const result = renderer.render(button);

		const svg = decodeSvg(result.image);

		expect(svg).toContain('UltramarinesBlue');
	});

	it.each([
		['light background', '#cccccc', '#000000'],
		['dark background', '#101010', '#ffffff'],
		['very dark background', '#050505', '#ffffff']
	] as const)('should use the correct text color on a %s', (_description, color, expectedTextColor) => {
		const button = {
			type: 'color',
			label: 'Color',
			color,
			value: 'red'
		} satisfies PaintSelectorButton;

		const svg = decodeSvg(renderer.render(button).image);

		expect(svg).toContain(`fill="${expectedTextColor}"`);
	});

	it.each([
		[24, '#151515', 'Home'],
		[12, '#5a1f1f', 'Server'],
		[13, '#5a1f1f', 'offline'],
		[0, '#000000', '']
	] as const)('should render offline slot %i', (slotIndex, expectedColor, expectedLabel) => {
		const svg = decodeSvg(renderer.renderOffline(slotIndex).image);

		expect(svg).toContain(expectedColor);

		if (expectedLabel) {
			expect(svg).toContain(expectedLabel);
		}
	});

	it.each([
		['Base', 'base', 28],
		['Contrast Red', 'contrast', 24],
		['Very Long Category Name', 'long', 20]
	] as const)('should use the expected font size for "%s"', (label, value, fontSize) => {
		const button = {
			type: 'category',
			label,
			value
		} satisfies PaintSelectorButton;

		const svg = decodeSvg(renderer.render(button).image);

		expect(svg).toContain(`font-size="${fontSize}"`);
	});

	function decodeSvg(image?: string): string {
		return decodeURIComponent(image!.replace('data:image/svg+xml,', ''));
	}
});
