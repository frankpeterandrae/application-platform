/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JumpLink, StarSystem } from '@application-platform/starmap-domain';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { JumpLinkRendererService } from '../jump-links/jump-link-renderer.service';
import { WebglRendererFactory } from '../rendering/webgl-renderer.factory';
import { CameraService } from '../scene/camera.service';
import { ControlsService } from '../scene/controls.service';
import { StarMapSceneService } from '../scene/star-map-scene.service';
import { SystemRendererService } from '../systems/system-renderer.service';

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

	const scene = new Scene();
	const camera = new PerspectiveCamera();

	const sceneService = {
		getScene: vi.fn(() => scene)
	};

	const cameraService = {
		getCamera: vi.fn(() => camera),
		resize: vi.fn(),
		fitToSystems: vi.fn(() => ({
			x: 10,
			y: 20,
			z: 30
		}))
	};

	const systemRenderer = {
		render: vi.fn(),
		clear: vi.fn()
	};

	const systems: StarSystem[] = [
		{
			id: 'S001',
			name: 'Test System',
			position: {
				x: 1,
				y: 2,
				z: 3
			},
			stars: [],
			planets: []
		}
	];

	const jumpLinks: JumpLink[] = [
		{
			id: 'JL001',
			startSystemId: 'S001',
			endSystemId: 'S002',
			status: 'normal'
		}
	];

	const nebulae = [
		{
			id: 'N001',
			name: 'Nebula',
			style: 'cloud',
			color: '#ffffff',
			opacity: 0.5,
			nodes: [
				{
					id: 'node-1',
					position: {
						x: -15,
						y: 0,
						z: 0
					},
					radius: 1
				},
				{
					id: 'node-2',
					position: {
						x: 0,
						y: 18,
						z: 0
					},
					radius: 1
				},
				{
					id: 'node-3',
					position: {
						x: 1,
						y: 1,
						z: 20
					},
					radius: 1
				}
			],
			connections: []
		}
	];

	const controlsService = {
		initialize: vi.fn(),
		destroy: vi.fn(),
		setTarget: vi.fn()
	};

	const jumpLinkRendererService = {
		render: vi.fn(),
		clear: vi.fn()
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
				},
				{
					provide: StarMapSceneService,
					useValue: sceneService
				},
				{
					provide: CameraService,
					useValue: cameraService
				},
				{
					provide: SystemRendererService,
					useValue: systemRenderer
				},
				{
					provide: ControlsService,
					useValue: controlsService
				},
				{
					provide: JumpLinkRendererService,
					useValue: jumpLinkRendererService
				}
			]
		});

		fixture = TestBed.createComponent(StarMap3dComponent);
		component = fixture.componentInstance;

		fixture.componentRef.setInput('systems', systems);
		fixture.componentRef.setInput('jumpLinks', jumpLinks);
		fixture.componentRef.setInput('nebulae', nebulae);
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

	it('should configure the renderer size and camera', () => {
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
		expect(cameraService.resize).toHaveBeenCalledWith(800, 600);

		expect(renderer.render).toHaveBeenCalledWith(scene, camera);
	});

	it('should render the star systems', () => {
		fixture.detectChanges();

		expect(systemRenderer.render).toHaveBeenCalledWith(scene, systems);
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

		expect(cameraService.resize).toHaveBeenLastCalledWith(1200, 800);
	});

	it('should ignore resize when the viewport has no size', () => {
		fixture.detectChanges();

		expect(renderer.setSize).not.toHaveBeenCalled();
		expect(cameraService.resize).not.toHaveBeenCalled();
	});

	it('should dispose resources when destroyed', () => {
		fixture.detectChanges();

		const viewport = fixture.nativeElement.querySelector('.star-map-3d-viewport') as HTMLElement;

		expect(viewport.contains(canvas)).toBe(true);

		fixture.destroy();

		expect(disconnect).toHaveBeenCalledOnce();
		expect(systemRenderer.clear).toHaveBeenCalledOnce();
		expect(jumpLinkRendererService.clear).toHaveBeenCalledOnce();
		expect(renderer.dispose).toHaveBeenCalledOnce();
		expect(viewport.contains(canvas)).toBe(false);
	});

	it('should initialize camera controls', () => {
		fixture.detectChanges();

		expect(controlsService.initialize).toHaveBeenCalledOnce();

		const [domElement, renderCallback] = controlsService.initialize.mock.calls[0];

		expect(domElement).toBe(canvas);
		expect(renderCallback).toEqual(expect.any(Function));
	});

	it('should destroy camera controls when destroyed', () => {
		fixture.detectChanges();

		fixture.destroy();

		expect(controlsService.destroy).toHaveBeenCalledOnce();
	});

	it('should fit the camera to the systems', () => {
		fixture.detectChanges();

		cameraService.fitToSystems.mockClear();
		controlsService.setTarget.mockClear();

		component.fitToViewport();

		expect(cameraService.fitToSystems).toHaveBeenCalledWith(systems);

		expect(controlsService.setTarget).toHaveBeenCalledWith({
			x: 10,
			y: 20,
			z: 30
		});
	});

	it('should render the jump links', () => {
		fixture.detectChanges();

		expect(jumpLinkRendererService.render).toHaveBeenCalledWith(scene, systems, jumpLinks);
	});

	it('should update jump links when the systems change', () => {
		fixture.detectChanges();

		jumpLinkRendererService.render.mockClear();

		const updatedSystems: StarSystem[] = [
			...systems,
			{
				id: 'S003',
				name: 'Gamma',
				position: {
					x: 10,
					y: 20,
					z: 30
				},
				stars: [],
				planets: []
			}
		];

		fixture.componentRef.setInput('systems', updatedSystems);

		fixture.detectChanges();

		expect(jumpLinkRendererService.render).toHaveBeenCalledWith(scene, updatedSystems, jumpLinks);
	});

	it('should update jump links when the jump links change', () => {
		fixture.detectChanges();

		jumpLinkRendererService.render.mockClear();

		const updatedJumpLinks: JumpLink[] = [
			...jumpLinks,
			{
				id: 'J002',
				startSystemId: 'S002',
				endSystemId: 'S001',
				status: 'dangerous'
			}
		];

		fixture.componentRef.setInput('jumpLinks', updatedJumpLinks);

		fixture.detectChanges();

		expect(jumpLinkRendererService.render).toHaveBeenCalledWith(scene, systems, updatedJumpLinks);
	});
});
