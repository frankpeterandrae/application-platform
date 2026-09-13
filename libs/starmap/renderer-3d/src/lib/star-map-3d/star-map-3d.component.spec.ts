/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { WebglRendererFactory } from '../rendering/webgl-renderer.factory';

import { StarMap3dComponent } from './star-map-3d.component';

describe('StarMap3dComponent', () => {
	let component: StarMap3dComponent;
	let fixture: ComponentFixture<StarMap3dComponent>;

	let resizeCallback: ResizeObserverCallback;

	const canvas = document.createElement('canvas');

	const renderer = {
		domElement: canvas,
		setSize: vi.fn(),
		render: vi.fn(),
		dispose: vi.fn()
	} as unknown as WebGLRenderer;

	const rendererFactory = {
		create: vi.fn(() => renderer)
	};

	const observe = vi.fn();
	const disconnect = vi.fn();

	beforeEach(async () => {
		vi.clearAllMocks();

		globalThis.ResizeObserver = class implements ResizeObserver {
			constructor(callback: ResizeObserverCallback) {
				resizeCallback = callback;
			}

			public readonly observe = observe;
			public readonly unobserve = vi.fn();
			public readonly disconnect = disconnect;
		};

		await setupTestingModule({
			imports: [StarMap3dComponent],
			providers: [
				{
					provide: WebglRendererFactory,
					useValue: rendererFactory
				}
			]
		});

		fixture = TestBed.createComponent(StarMap3dComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		fixture.detectChanges();

		expect(component).toBeTruthy();
	});

	it('should create the WebGL renderer', () => {
		fixture.detectChanges();

		expect(rendererFactory.create).toHaveBeenCalledOnce();
	});

	it('should append the renderer canvas to the viewport', () => {
		fixture.detectChanges();

		const viewport = fixture.nativeElement.querySelector('.star-map-3d-viewport') as HTMLElement;

		expect(viewport.contains(canvas)).toBe(true);
	});

	it('should observe viewport resize changes', () => {
		fixture.detectChanges();

		const viewport = fixture.nativeElement.querySelector('.star-map-3d-viewport') as HTMLElement;

		expect(observe).toHaveBeenCalledWith(viewport);
	});

	it('should configure the renderer size and camera aspect', () => {
		const viewport = fixture.nativeElement.querySelector('.star-map-3d-viewport') as HTMLElement;

		Object.defineProperty(viewport, 'clientWidth', {
			configurable: true,
			value: 800
		});

		Object.defineProperty(viewport, 'clientHeight', {
			configurable: true,
			value: 600
		});

		fixture.detectChanges();

		expect(renderer.setSize).toHaveBeenCalledWith(800, 600, false);

		const renderCall = vi.mocked(renderer.render).mock.calls[0];

		expect(renderCall).toBeDefined();

		const [scene, camera] = renderCall;

		expect(scene).toBeInstanceOf(Scene);
		expect(camera).toBeInstanceOf(PerspectiveCamera);

		expect((camera as PerspectiveCamera).aspect).toBe(800 / 600);
		expect((camera as PerspectiveCamera).position.z).toBe(10);
	});

	it('should update the renderer when the viewport is resized', () => {
		const viewport = fixture.nativeElement.querySelector('.star-map-3d-viewport') as HTMLElement;

		Object.defineProperty(viewport, 'clientWidth', {
			configurable: true,
			value: 800
		});

		Object.defineProperty(viewport, 'clientHeight', {
			configurable: true,
			value: 600
		});

		fixture.detectChanges();

		Object.defineProperty(viewport, 'clientWidth', {
			configurable: true,
			value: 1200
		});

		Object.defineProperty(viewport, 'clientHeight', {
			configurable: true,
			value: 800
		});

		resizeCallback([], {} as ResizeObserver);

		expect(renderer.setSize).toHaveBeenLastCalledWith(1200, 800, false);
	});

	it('should ignore resize when the viewport has no size', () => {
		fixture.detectChanges();

		expect(renderer.setSize).not.toHaveBeenCalled();
	});

	it('should dispose renderer resources when destroyed', () => {
		fixture.detectChanges();

		const viewport = fixture.nativeElement.querySelector('.star-map-3d-viewport') as HTMLElement;

		expect(viewport.contains(canvas)).toBe(true);

		fixture.destroy();

		expect(disconnect).toHaveBeenCalledOnce();
		expect(renderer.dispose).toHaveBeenCalledOnce();
		expect(viewport.contains(canvas)).toBe(false);
	});
});
