/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { Position3d } from '@application-platform/starmap-domain';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { CameraService } from './camera.service';

/**
 * Manages user interaction with the 3D star map camera.
 */
@Injectable({
	providedIn: 'root'
})
export class ControlsService {
	private readonly cameraService = inject(CameraService);

	private controls: OrbitControls | null = null;
	private renderCallback: (() => void) | null = null;

	private readonly handleChange = (): void => {
		this.renderCallback?.();
	};

	/**
	 * Creates OrbitControls for the supplied DOM element and wires them to
	 * trigger rendering whenever the user changes the camera position.
	 *
	 * Calling this method replaces any existing controls instance.
	 *
	 * @param domElement The HTML element that receives pointer and wheel events.
	 * @param renderCallback Callback invoked after control changes to request a re-render.
	 */
	public initialize(domElement: HTMLElement, renderCallback: () => void): void {
		this.destroy();

		this.renderCallback = renderCallback;

		this.controls = new OrbitControls(this.cameraService.getCamera(), domElement);

		this.controls.enableRotate = true;
		this.controls.enableZoom = true;
		this.controls.enablePan = true;

		this.controls.addEventListener('change', this.handleChange);

		this.controls.update();
	}

	/**
	 * Disposes the current controls instance and clears the render callback.
	 *
	 * Safe to call multiple times.
	 */
	public destroy(): void {
		if (!this.controls) {
			this.renderCallback = null;
			return;
		}

		this.controls.removeEventListener('change', this.handleChange);

		this.controls.dispose();

		this.controls = null;
		this.renderCallback = null;
	}

	/**
	 * Updates the OrbitControls target to the supplied 3D position.
	 *
	 * The controls are updated immediately so the camera reacts to the new
	 * focus point without waiting for another interaction event.
	 *
	 * @param target The new target position for the camera controls.
	 */
	public setTarget(target: Position3d): void {
		if (!this.controls) {
			return;
		}

		this.controls.target.set(target.x, target.y, target.z);

		this.controls.update();
	}
}
