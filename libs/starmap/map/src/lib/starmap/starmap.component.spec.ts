/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarMapStore } from '@application-platform/starmap-data-access';
import { StarMap } from '@application-platform/starmap-domain';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { SvgExportService } from '../export/svg-export.service';

import { StarmapComponent } from './starmap.component';

function configureViewport(viewport: HTMLElement, width = 800, height = 600): void {
	Object.defineProperty(viewport, 'clientWidth', {
		configurable: true,
		value: width
	});

	Object.defineProperty(viewport, 'clientHeight', {
		configurable: true,
		value: height
	});

	vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
		x: 0,
		y: 0,
		top: 0,
		left: 0,
		right: width,
		bottom: height,
		width,
		height,
		toJSON: () => ({})
	});
}

describe('StarmapComponent', () => {
	let component: StarmapComponent;
	let fixture: ComponentFixture<StarmapComponent>;
	let store: StarMapStore;

	const svgExportService = {
		export: vi.fn()
	};

	const map: StarMap = {
		id: 'test-map',
		name: 'Test Map',
		systems: [
			{
				id: 'S001',
				name: 'Sol',
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				stars: [
					{
						spectralType: 'G2'
					}
				],
				planets: []
			},
			{
				id: 'S002',
				name: 'Alpha Centauri',
				position: {
					x: 4,
					y: 2,
					z: 1
				},
				stars: [
					{
						spectralType: 'G2'
					}
				],
				planets: []
			}
		],
		jumpLinks: [],
		nebulae: []
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		await setupTestingModule({
			imports: [StarmapComponent],
			providers: [
				{
					provide: SvgExportService,
					useValue: svgExportService
				}
			]
		});

		store = TestBed.inject(StarMapStore);
		store.setMap(map);

		fixture = TestBed.createComponent(StarmapComponent);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should render the current star map', () => {
		const svg = fixture.nativeElement.querySelector('.starmap-container svg');

		expect(svg).toBeTruthy();

		expect(svg.querySelectorAll('.star-system')).toHaveLength(2);
	});

	it('should show system details when a star system is clicked', () => {
		const system = fixture.nativeElement.querySelector('[data-system-id="S001"]') as SVGGElement;

		system.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true
			})
		);

		fixture.detectChanges();

		const details = fixture.nativeElement.querySelector('starmap-system-details');

		expect(details).toBeTruthy();
		expect(details.textContent).toContain('Sol');
	});

	it('should select a star system using the keyboard', () => {
		const system = fixture.nativeElement.querySelector('[data-system-id="S002"]') as SVGGElement;

		system.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				bubbles: true
			})
		);

		fixture.detectChanges();

		const details = fixture.nativeElement.querySelector('starmap-system-details');

		expect(details.textContent).toContain('Alpha Centauri');
	});

	it('should not select a system for unrelated keyboard input', () => {
		const system = fixture.nativeElement.querySelector('[data-system-id="S001"]') as SVGGElement;

		system.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Escape',
				bubbles: true
			})
		);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('starmap-system-details')).toBeNull();
	});

	it('should export the rendered SVG', () => {
		component.exportSvg();

		expect(svgExportService.export).toHaveBeenCalledOnce();

		const [svg, fileName] = svgExportService.export.mock.calls[0];

		expect(svg).toBeInstanceOf(SVGSVGElement);
		expect(fileName).toBe('Test Map');
	});

	it('should fit the map into the viewport', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		const canvas = fixture.nativeElement.querySelector('.starmap-canvas') as HTMLElement;

		const container = fixture.nativeElement.querySelector('.starmap-container') as HTMLElement;

		configureViewport(viewport);

		component.fitToViewport();

		expect(canvas.style.width).not.toBe('');
		expect(canvas.style.height).not.toBe('');
		expect(container.style.transform).toMatch(/^scale\(.+\)$/);
	});

	it('should keep the same zoom when fitting repeatedly', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		const container = fixture.nativeElement.querySelector('.starmap-container') as HTMLElement;

		configureViewport(viewport);

		component.fitToViewport();

		const firstTransform = container.style.transform;

		component.fitToViewport();

		expect(container.style.transform).toBe(firstTransform);
	});

	it('should zoom in around the mouse position', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		const container = fixture.nativeElement.querySelector('.starmap-container') as HTMLElement;

		configureViewport(viewport);

		component.fitToViewport();

		const previousTransform = container.style.transform;

		viewport.dispatchEvent(
			new WheelEvent('wheel', {
				deltaY: -100,
				clientX: 400,
				clientY: 300,
				bubbles: true
			})
		);

		expect(container.style.transform).not.toBe(previousTransform);
	});

	it('should pan the viewport after dragging', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		viewport.scrollLeft = 100;
		viewport.scrollTop = 100;

		viewport.setPointerCapture = vi.fn();
		viewport.hasPointerCapture = vi.fn(() => true);
		viewport.releasePointerCapture = vi.fn();

		viewport.dispatchEvent(
			new PointerEvent('pointerdown', {
				button: 0,
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				bubbles: true
			})
		);

		viewport.dispatchEvent(
			new PointerEvent('pointermove', {
				pointerId: 1,
				clientX: 80,
				clientY: 70,
				bubbles: true
			})
		);

		expect(viewport.scrollLeft).toBe(120);
		expect(viewport.scrollTop).toBe(130);

		viewport.dispatchEvent(
			new PointerEvent('pointerup', {
				pointerId: 1,
				clientX: 80,
				clientY: 70,
				bubbles: true
			})
		);

		expect(viewport.releasePointerCapture).toHaveBeenCalledWith(1);
	});

	it('should execute the initial fit callback', async () => {
		const callback = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((handler) => {
			handler(0);
			return 1;
		});

		fixture.destroy();

		fixture = TestBed.createComponent(StarmapComponent);
		component = fixture.componentInstance;

		fixture.detectChanges();
		await fixture.whenStable();

		expect(callback).toHaveBeenCalled();
	});

	it('should clear the rendered map when the store is cleared', () => {
		const container = fixture.nativeElement.querySelector('.starmap-container');

		expect(container.querySelector('svg')).toBeTruthy();

		store.clear();
		fixture.detectChanges();

		expect(container.querySelector('svg')).toBeNull();
	});

	it('should ignore a click outside a star system', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport');

		viewport.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true
			})
		);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('starmap-system-details')).toBeNull();
	});

	it('should ignore a star system without a system id', () => {
		const container = fixture.nativeElement.querySelector('.starmap-container svg');

		const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

		group.classList.add('star-system');
		container.append(group);

		group.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true
			})
		);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('starmap-system-details')).toBeNull();
	});

	it('should select a star system using the space key', () => {
		const system = fixture.nativeElement.querySelector('[data-system-id="S001"]');

		system.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: ' ',
				bubbles: true
			})
		);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('starmap-system-details')?.textContent).toContain('Sol');
	});

	it('should zoom out around the mouse position', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		const container = fixture.nativeElement.querySelector('.starmap-container') as HTMLElement;

		configureViewport(viewport);

		component.fitToViewport();

		const previousTransform = container.style.transform;

		viewport.dispatchEvent(
			new WheelEvent('wheel', {
				deltaY: 100,
				clientX: 400,
				clientY: 300,
				bubbles: true
			})
		);

		expect(container.style.transform).not.toBe(previousTransform);
	});

	it('should ignore non-primary pointer buttons', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		viewport.scrollLeft = 100;
		viewport.scrollTop = 100;

		viewport.dispatchEvent(
			new PointerEvent('pointerdown', {
				button: 1,
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				bubbles: true
			})
		);

		viewport.dispatchEvent(
			new PointerEvent('pointermove', {
				pointerId: 1,
				clientX: 50,
				clientY: 50,
				bubbles: true
			})
		);

		expect(viewport.scrollLeft).toBe(100);
		expect(viewport.scrollTop).toBe(100);
	});

	it('should not pan below the drag threshold', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		viewport.scrollLeft = 100;
		viewport.scrollTop = 100;

		viewport.dispatchEvent(
			new PointerEvent('pointerdown', {
				button: 0,
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				bubbles: true
			})
		);

		viewport.dispatchEvent(
			new PointerEvent('pointermove', {
				pointerId: 1,
				clientX: 102,
				clientY: 102,
				bubbles: true
			})
		);

		expect(viewport.scrollLeft).toBe(100);
		expect(viewport.scrollTop).toBe(100);
	});

	it('should suppress the click immediately following a drag', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		viewport.setPointerCapture = vi.fn();
		viewport.hasPointerCapture = vi.fn(() => false);
		viewport.releasePointerCapture = vi.fn();

		viewport.dispatchEvent(
			new PointerEvent('pointerdown', {
				button: 0,
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				bubbles: true
			})
		);

		viewport.dispatchEvent(
			new PointerEvent('pointermove', {
				pointerId: 1,
				clientX: 80,
				clientY: 80,
				bubbles: true
			})
		);

		viewport.dispatchEvent(
			new PointerEvent('pointerup', {
				pointerId: 1,
				bubbles: true
			})
		);

		const system = fixture.nativeElement.querySelector('[data-system-id="S001"]');

		system.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true
			})
		);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('starmap-system-details')).toBeNull();
	});

	it('should ignore an empty svg view box when fitting', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		const container = fixture.nativeElement.querySelector('.starmap-container') as HTMLElement;

		const svg = container.querySelector('svg')!;

		configureViewport(viewport);

		svg.setAttribute('viewBox', '0 0 0 0');

		const previousTransform = container.style.transform;

		component.fitToViewport();

		expect(container.style.transform).toBe(previousTransform);
	});

	it('should update the canvas size when the map changes after the initial render', () => {
		const container = fixture.nativeElement.querySelector('.starmap-container') as HTMLElement;

		store.setMap({
			...map,
			name: 'Updated Map'
		});

		fixture.detectChanges();

		expect(container.style.transform).toMatch(/^scale\(.+\)$/);
	});

	it('should ignore zoom when no map is rendered', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		store.clear();
		fixture.detectChanges();

		viewport.dispatchEvent(
			new WheelEvent('wheel', {
				deltaY: -100,
				bubbles: true
			})
		);

		expect(fixture.nativeElement.querySelector('.starmap-container svg')).toBeNull();
	});

	it('should ignore pointer up when panning has not started', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		viewport.dispatchEvent(
			new PointerEvent('pointerup', {
				pointerId: 1,
				bubbles: true
			})
		);

		expect(viewport.scrollLeft).toBe(0);
		expect(viewport.scrollTop).toBe(0);
	});

	it('should not suppress a click after pointer down without dragging', () => {
		const viewport = fixture.nativeElement.querySelector('.starmap-viewport') as HTMLElement;

		viewport.hasPointerCapture = vi.fn(() => false);

		viewport.dispatchEvent(
			new PointerEvent('pointerdown', {
				button: 0,
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				bubbles: true
			})
		);

		viewport.dispatchEvent(
			new PointerEvent('pointerup', {
				pointerId: 1,
				clientX: 100,
				clientY: 100,
				bubbles: true
			})
		);

		const system = fixture.nativeElement.querySelector('[data-system-id="S001"]');

		system.dispatchEvent(
			new MouseEvent('click', {
				bubbles: true
			})
		);

		fixture.detectChanges();

		expect(fixture.nativeElement.querySelector('starmap-system-details')?.textContent).toContain('Sol');
	});

	it('should ignore fitting when no map is rendered', () => {
		store.clear();
		fixture.detectChanges();

		expect(() => {
			component.fitToViewport();
		}).not.toThrow();
	});

	it('should close the system details', () => {
		(component as any).selectedSystemId.set(map.systems[0].id);

		expect((component as any).selectedSystem()).toEqual(map.systems[0]);

		(component as any).selectedSystemId.set(null);

		expect((component as any).selectedSystem()).toBeNull();
	});

	it('should ignore selection events without an Element target', () => {
		expect(() =>
			(component as any).selectSystem({
				target: null
			} as unknown as Event)
		).not.toThrow();
	});

	it('should ignore canvas size updates when elements are missing', () => {
		(component as any).mapCanvas = vi.fn(() => undefined);

		expect(() => (component as any).updateCanvasSize(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))).not.toThrow();
	});
});
