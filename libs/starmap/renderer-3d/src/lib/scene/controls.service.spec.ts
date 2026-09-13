/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { PerspectiveCamera } from 'three';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { CameraService } from './camera.service';
import { ControlsService } from './controls.service';

interface OrbitControlsMockInstance {
	target: {
		set: ReturnType<typeof vi.fn>;
	};
	enableRotate: boolean;
	enableZoom: boolean;
	enablePan: boolean;
	addEventListener: ReturnType<typeof vi.fn>;
	removeEventListener: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
	dispose: ReturnType<typeof vi.fn>;
	changeListener: (() => void) | null;
}

const orbitControlsMock = vi.hoisted(() => ({
	constructor: vi.fn(),
	instances: [] as OrbitControlsMockInstance[]
}));

vi.mock('three/addons/controls/OrbitControls.js', () => ({
	OrbitControls: class {
		public readonly target = {
			set: vi.fn()
		};

		public enableRotate = false;
		public enableZoom = false;
		public enablePan = false;

		public changeListener: (() => void) | null = null;

		public readonly addEventListener = vi.fn((event: string, listener: () => void) => {
			if (event === 'change') {
				this.changeListener = listener;
			}
		});

		public readonly removeEventListener = vi.fn();
		public readonly update = vi.fn();
		public readonly dispose = vi.fn();

		constructor(camera: unknown, domElement: unknown) {
			orbitControlsMock.constructor(camera, domElement);

			orbitControlsMock.instances.push(this);
		}
	}
}));

describe('ControlsService', () => {
	let service: ControlsService;

	const camera = new PerspectiveCamera();

	const cameraService = {
		getCamera: vi.fn(() => camera)
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		orbitControlsMock.instances.length = 0;

		await setupTestingModule({
			providers: [
				ControlsService,
				{
					provide: CameraService,
					useValue: cameraService
				}
			]
		});

		service = TestBed.inject(ControlsService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should initialize orbit controls', () => {
		const element = document.createElement('div');

		service.initialize(element, vi.fn());

		expect(orbitControlsMock.constructor).toHaveBeenCalledWith(camera, element);

		const controls = orbitControlsMock.instances[0];

		expect(controls.enableRotate).toBe(true);
		expect(controls.enableZoom).toBe(true);
		expect(controls.enablePan).toBe(true);

		expect(controls.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

		expect(controls.update).toHaveBeenCalledOnce();
	});

	it('should render when controls change', () => {
		const render = vi.fn();

		service.initialize(document.createElement('div'), render);

		const controls = orbitControlsMock.instances[0];

		controls.changeListener?.();

		expect(render).toHaveBeenCalledOnce();
	});

	it('should update the controls target', () => {
		service.initialize(document.createElement('div'), vi.fn());

		const controls = orbitControlsMock.instances[0];

		controls.update.mockClear();

		service.setTarget({
			x: 10,
			y: 20,
			z: 30
		});

		expect(controls.target.set).toHaveBeenCalledWith(10, 20, 30);

		expect(controls.update).toHaveBeenCalledOnce();
	});

	it('should ignore target changes before initialization', () => {
		expect(() => {
			service.setTarget({
				x: 10,
				y: 20,
				z: 30
			});
		}).not.toThrow();

		expect(orbitControlsMock.instances).toHaveLength(0);
	});

	it('should dispose controls', () => {
		service.initialize(document.createElement('div'), vi.fn());

		const controls = orbitControlsMock.instances[0];

		const changeListener = controls.addEventListener.mock.calls[0][1];

		service.destroy();

		expect(controls.removeEventListener).toHaveBeenCalledWith('change', changeListener);

		expect(controls.dispose).toHaveBeenCalledOnce();
	});

	it('should dispose existing controls before reinitializing', () => {
		const element = document.createElement('div');

		service.initialize(element, vi.fn());

		const firstControls = orbitControlsMock.instances[0];

		service.initialize(element, vi.fn());

		expect(firstControls.dispose).toHaveBeenCalledOnce();

		expect(orbitControlsMock.instances).toHaveLength(2);
	});
});
