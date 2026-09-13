/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AfterViewInit, Component, DestroyRef, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { StarSystem } from '@application-platform/starmap-domain';
import { WebGLRenderer } from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

import { WebglRendererFactory } from '../rendering/webgl-renderer.factory';
import { CameraService } from '../scene/camera.service';
import { ControlsService } from '../scene/controls.service';
import { StarMapSceneService } from '../scene/star-map-scene.service';
import { SystemLabelCollisionService } from '../systems/system-label-collision.service';
import { SystemLabelRendererService } from '../systems/system-label-renderer.service';
import { SystemLabelVisibilityService } from '../systems/system-label-visibility.service';
import { SystemRendererService } from '../systems/system-renderer.service';

/**
 * Displays the interactive three-dimensional star map.
 */
@Component({
	selector: 'starmap-3d-container',
	imports: [],
	templateUrl: './star-map-3d.component.html',
	styleUrl: './star-map-3d.component.scss'
})
export class StarMap3dComponent implements AfterViewInit {
	public readonly systems = input.required<StarSystem[]>();

	private readonly rendererFactory = inject(WebglRendererFactory);
	private readonly systemRenderer = inject(SystemRendererService);
	private readonly destroyRef = inject(DestroyRef);
	private readonly sceneService = inject(StarMapSceneService);
	private readonly cameraService = inject(CameraService);
	private readonly controlsService = inject(ControlsService);
	private readonly systemLabelRenderer = inject(SystemLabelRendererService);
	private readonly systemLabelVisibilityService = inject(SystemLabelVisibilityService);
	private readonly systemLabelCollisionService = inject(SystemLabelCollisionService);

	private readonly viewport = viewChild.required<ElementRef<HTMLDivElement>>('viewport');

	private labelRenderer: CSS2DRenderer | null = null;

	private renderer: WebGLRenderer | null = null;

	private resizeObserver: ResizeObserver | null = null;

	constructor() {
		effect(() => {
			const systems = this.systems();

			if (!this.renderer) {
				return;
			}

			this.systemRenderer.render(this.sceneService.getScene(), systems);
			this.systemLabelRenderer.render(this.sceneService.getScene(), systems);

			this.render();
		});
	}

	ngAfterViewInit(): void {
		const viewport = this.viewport().nativeElement;

		this.renderer = this.rendererFactory.create();

		viewport.append(this.renderer.domElement);

		this.labelRenderer = new CSS2DRenderer();
		this.labelRenderer.domElement.className = 'star-map-3d-label-layer';
		this.labelRenderer.domElement.style.position = 'absolute';
		this.labelRenderer.domElement.style.inset = '0';
		this.labelRenderer.domElement.style.pointerEvents = 'none';

		viewport.append(this.labelRenderer.domElement);

		this.controlsService.initialize(this.renderer.domElement, () => this.render());

		this.resizeObserver = new ResizeObserver(() => {
			this.resize();
		});

		this.resizeObserver.observe(viewport);

		this.resize();

		this.systemRenderer.render(this.sceneService.getScene(), this.systems());
		this.systemLabelRenderer.render(this.sceneService.getScene(), this.systems());

		this.fitToViewport();

		this.destroyRef.onDestroy(() => {
			this.destroyRenderer();
		});
	}

	/**
	 * Adjusts the camera position and orientation to fit all star systems within the view.
	 */
	public fitToViewport(): void {
		const target = this.cameraService.fitToSystems(this.systems());

		if (!target) {
			return;
		}

		this.controlsService.setTarget(target);
		this.render();
	}

	private resize(): void {
		const renderer = this.renderer;
		const labelRenderer = this.labelRenderer;

		if (!renderer || !labelRenderer) {
			return;
		}

		const viewport = this.viewport().nativeElement;

		const width = viewport.clientWidth;
		const height = viewport.clientHeight;

		if (width === 0 || height === 0) {
			return;
		}

		this.cameraService.resize(width, height);

		renderer.setSize(width, height, false);
		labelRenderer.setSize(width, height);

		this.render();
	}

	private render(): void {
		if (!this.renderer || !this.labelRenderer) {
			return;
		}

		const scene = this.sceneService.getScene();
		const camera = this.cameraService.getCamera();

		const candidateSystemIds = this.systemLabelVisibilityService.getVisibleSystemIds(this.systems(), camera.position);

		this.systemLabelRenderer.updateVisibility(candidateSystemIds);

		this.renderer.render(scene, camera);

		// First pass positions all candidate labels in screen space.
		this.labelRenderer.render(scene, camera);

		const labelBounds = this.systemLabelRenderer.getLabelBounds(candidateSystemIds);

		const visibleSystemIds = this.systemLabelCollisionService.getVisibleSystemIds(labelBounds);

		this.systemLabelRenderer.updateVisibility(visibleSystemIds);

		// Second pass applies the collision result.
		this.labelRenderer.render(scene, camera);
	}

	private destroyRenderer(): void {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;

		this.controlsService.destroy();
		this.systemRenderer.clear();
		this.systemLabelRenderer.clear();

		this.labelRenderer?.domElement.remove();
		this.labelRenderer = null;

		if (!this.renderer) {
			return;
		}

		this.renderer.domElement.remove();
		this.renderer.dispose();

		this.renderer = null;
	}
}
