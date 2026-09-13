/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AfterViewInit, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

import { WebglRendererFactory } from '../rendering/webgl-renderer.factory';

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
	private readonly rendererFactory = inject(WebglRendererFactory);
	private readonly destroyRef = inject(DestroyRef);

	private readonly viewport = viewChild.required<ElementRef<HTMLDivElement>>('viewport');

	private readonly scene = new Scene();

	private readonly camera = new PerspectiveCamera(60, 1, 0.1, 10_000);

	private renderer: WebGLRenderer | null = null;

	private resizeObserver: ResizeObserver | null = null;

	ngAfterViewInit(): void {
		const viewport = this.viewport().nativeElement;

		this.renderer = this.rendererFactory.create();

		viewport.append(this.renderer.domElement);

		this.camera.position.set(0, 0, 10);

		this.resizeObserver = new ResizeObserver(() => {
			this.resize();
		});

		this.resizeObserver.observe(viewport);

		this.resize();

		this.renderer.render(this.scene, this.camera);

		this.destroyRef.onDestroy(() => {
			this.destroyRenderer();
		});
	}

	private resize(): void {
		const renderer = this.renderer;

		if (!renderer) {
			return;
		}

		const viewport = this.viewport().nativeElement;

		const width = viewport.clientWidth;
		const height = viewport.clientHeight;

		if (width === 0 || height === 0) {
			return;
		}

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		renderer.setSize(width, height, false);
		renderer.render(this.scene, this.camera);
	}

	private destroyRenderer(): void {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;

		if (!this.renderer) {
			return;
		}

		this.renderer.domElement.remove();
		this.renderer.dispose();

		this.renderer = null;
	}
}
