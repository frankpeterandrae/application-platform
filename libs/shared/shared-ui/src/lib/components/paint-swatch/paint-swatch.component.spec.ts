/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Paint, PaintColorGroup } from '@application-platform/paint';

import { setupTestingModule } from '../../../test-setup';

import { PaintSwatchComponent } from './paint-swatch.component';

describe('PaintSwatchComponent', () => {
	let component: PaintSwatchComponent;
	let fixture: ComponentFixture<PaintSwatchComponent>;

	const createPaint = (
		colorGroups: readonly PaintColorGroup[],
		mainColor = '#112233' as '#${string}',
		secondaryColor = '#aabbcc' as '#${string}'
	): Paint => ({
		id: 'test:01',
		brand: 'test',
		sku: '01',
		name: 'Test Paint',
		mainColor,
		secondaryColor,
		colorGroups
	});

	beforeEach(async () => {
		await setupTestingModule({
			imports: [PaintSwatchComponent]
		});

		fixture = TestBed.createComponent(PaintSwatchComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should use the color input when no paint is provided', () => {
		fixture.componentRef.setInput('color', '#123456');
		fixture.detectChanges();

		const stops = getGradientStops();

		expect(stops).toHaveLength(2);
		expect(stops[0].getAttribute('stop-color')).toBe('#123456');
		expect(stops[1].getAttribute('stop-color')).toBe('#123456');
	});

	it('should render the default horizontal gradient', () => {
		setPaint(createPaint([]));

		const gradient = getBaseLinearGradient();
		const stops = getStops(gradient);

		expect(gradient.getAttribute('x1')).toBe('0%');
		expect(gradient.getAttribute('y1')).toBe('50%');
		expect(gradient.getAttribute('x2')).toBe('100%');
		expect(gradient.getAttribute('y2')).toBe('50%');

		expect(stops).toHaveLength(2);
		expect(stops[0].getAttribute('stop-color')).toBe('#aabbcc');
		expect(stops[1].getAttribute('stop-color')).toBe('#112233');
	});

	it('should render a radial gradient for metallics', () => {
		setPaint(createPaint([PaintColorGroup.Metallic]));

		const gradient = fixture.nativeElement.querySelector('defs radialGradient') as SVGRadialGradientElement | null;
		expect(gradient).not.toBeNull();

		const stops = getStops(gradient!);

		expect(stops).toHaveLength(2);
		expect(stops[0].getAttribute('stop-color')).toBe('#aabbcc');
		expect(stops[1].getAttribute('stop-color')).toBe('#112233');
	});

	it.each([PaintColorGroup.Inks, PaintColorGroup.Glaze])('should render the vertical gradient for %s', (colorGroup) => {
		setPaint(createPaint([colorGroup]));

		const gradient = getBaseLinearGradient();
		const stops = getStops(gradient);

		expect(gradient.getAttribute('x1')).toBe('50%');
		expect(gradient.getAttribute('y1')).toBe('100%');
		expect(gradient.getAttribute('x2')).toBe('50%');
		expect(gradient.getAttribute('y2')).toBe('0%');

		expect(stops).toHaveLength(2);
		expect(stops[0].getAttribute('stop-color')).toBe('#112233');
		expect(stops[1].getAttribute('stop-color')).toBe('#aabbcc');
	});

	it('should render a radial gradient for washes', () => {
		setPaint(createPaint([PaintColorGroup.Washes]));

		const gradient = fixture.nativeElement.querySelector('defs radialGradient') as SVGRadialGradientElement | null;

		expect(gradient).not.toBeNull();

		const stops = getStops(gradient!);

		expect(stops).toHaveLength(2);
		expect(stops[0].getAttribute('stop-color')).toBe('#112233');
		expect(stops[1].getAttribute('stop-color')).toBe('#aabbcc');
	});

	it('should fall back to the main color when no secondary color is provided', () => {
		const paint: Paint = {
			id: 'test:01',
			brand: 'test',
			sku: '01',
			name: 'Test Paint',
			mainColor: '#112233',
			colorGroups: []
		};

		setPaint(paint);

		const stops = getStops(getBaseLinearGradient());

		expect(stops[0].getAttribute('stop-color')).toBe('#112233');
		expect(stops[1].getAttribute('stop-color')).toBe('#112233');
	});

	it('should render technical paints using the split blob', () => {
		setPaint(createPaint([PaintColorGroup.Technical]));

		const svg = fixture.nativeElement.querySelector('svg') as SVGElement;

		const clipPath = svg.querySelector('clipPath');
		const clippedGroup = svg.querySelector('g[clip-path]');
		const visiblePaths = Array.from(svg.querySelectorAll(':scope > path'));

		expect(clipPath).not.toBeNull();
		expect(clippedGroup).not.toBeNull();

		/*
		 * The complete blob forms the lower area and therefore uses
		 * the paint's main color directly.
		 */
		expect(visiblePaths).toHaveLength(1);
		expect(visiblePaths[0].getAttribute('fill')).toBe('#112233');

		/*
		 * The upper area is rendered separately inside the blob clip.
		 */
		const upperPath = clippedGroup?.querySelector('path');

		expect(upperPath).not.toBeNull();
		expect(upperPath?.getAttribute('fill')).toContain('technical-top-gradient');
	});

	it('should create unique SVG resource ids for multiple components', () => {
		const secondFixture = TestBed.createComponent(PaintSwatchComponent);

		fixture.componentRef.setInput('color', '#112233');
		secondFixture.componentRef.setInput('color', '#445566');

		fixture.detectChanges();
		secondFixture.detectChanges();

		const firstGradient = fixture.nativeElement.querySelector('defs linearGradient') as SVGLinearGradientElement;

		const secondGradient = secondFixture.nativeElement.querySelector('defs linearGradient') as SVGLinearGradientElement;

		expect(firstGradient.id).not.toBe(secondGradient.id);

		secondFixture.destroy();
	});

	function setPaint(paint: Paint): void {
		fixture.componentRef.setInput('paint', paint);
		fixture.detectChanges();
	}

	function getBaseLinearGradient(): SVGLinearGradientElement {
		const gradients = Array.from(fixture.nativeElement.querySelectorAll('defs linearGradient')) as SVGLinearGradientElement[];

		const gradient = gradients.find((element) => element.id.endsWith('-base-gradient'));

		expect(gradient).toBeDefined();

		return gradient!;
	}

	function getGradientStops(): SVGStopElement[] {
		return getStops(getBaseLinearGradient());
	}

	function getStops(gradient: SVGGradientElement): SVGStopElement[] {
		return Array.from(gradient.querySelectorAll('stop')) as SVGStopElement[];
	}
});
