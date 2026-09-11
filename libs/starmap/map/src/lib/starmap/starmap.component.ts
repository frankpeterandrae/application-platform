/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { Logger } from '@application-platform/shared-ui';
import { StarMapStore } from '@application-platform/starmap-data-access';
import { StarSystem } from '@application-platform/starmap-domain';

import { SvgExportService } from '../export/svg-export.service';
import { StarMapSvgRendererService } from '../rendering/star-map-svg-renderer.service';
import { SystemDetailsComponent } from '../system-details/system-details.component';

/**
 * Component representing the star map feature.
 */
@Component({
	selector: 'starmap-container',
	imports: [SystemDetailsComponent],
	templateUrl: './starmap.component.html',
	styleUrl: './starmap.component.scss',
	host: {
		'(click)': 'selectSystem($event)',
		'(keydown)': 'selectSystemByKeyboard($event)'
	}
})
export class StarmapComponent {
	private readonly store = inject(StarMapStore);

	private readonly renderer = inject(StarMapSvgRendererService);
	private readonly svgExportService = inject(SvgExportService);
	private readonly logger = inject(Logger);

	private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

	protected readonly selectedSystem = signal<StarSystem | null>(null);

	private readonly mapCanvas = viewChild<ElementRef<HTMLDivElement>>('mapCanvas');

	private readonly zoomLevel = signal(1);

	private readonly minimumZoom = 0.05;
	private readonly maximumZoom = 4;

	private readonly zoomFactor = 1.1;

	private readonly mapViewport = viewChild<ElementRef<HTMLDivElement>>('mapViewport');

	private initialZoomApplied = false;

	private isPanning = false;

	private panStartX = 0;

	private panStartY = 0;

	private panStartScrollLeft = 0;

	private panStartScrollTop = 0;

	private hasDragged = false;

	private suppressClick = false;

	constructor() {
		effect(() => {
			const container = this.mapContainer()?.nativeElement;

			if (!container) {
				return;
			}

			const map = this.store.map();

			if (!map) {
				container.replaceChildren();
				return;
			}

			const svg = this.renderer.render(map);

			svg.classList.add('starmap');

			container.replaceChildren(svg);
			if (!this.initialZoomApplied) {
				this.initialZoomApplied = true;

				requestAnimationFrame(() => {
					this.fitToViewport();
				});
			} else {
				this.updateCanvasSize(svg);
			}
		});
	}

	protected selectSystem(event: Event): void {
		if (this.suppressClick) {
			this.suppressClick = false;
			return;
		}
		this.logger.debug('selectSystem called with event:', event);

		const target = event.target;

		if (!(target instanceof Element)) {
			return;
		}
		this.logger.debug('Event target is an Element:', target);

		const systemElement = target.closest<SVGGElement>('.star-system');

		if (!systemElement) {
			return;
		}
		this.logger.debug('Found closest .star-system element:', systemElement);

		const systemId = systemElement.dataset['systemId'];

		if (!systemId) {
			return;
		}
		this.logger.debug('Found systemId:', systemId);

		const map = this.store.map();

		const system = map?.systems.find((candidate) => candidate.id === systemId) ?? null;

		this.selectedSystem.set(system);
	}

	protected selectSystemByKeyboard(event: KeyboardEvent): void {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		event.preventDefault();

		this.selectSystem(event);
	}

	private updateCanvasSize(svg: SVGSVGElement): void {
		const canvas = this.mapCanvas()?.nativeElement;
		const container = this.mapContainer()?.nativeElement;

		if (!canvas || !container) {
			return;
		}

		const viewBox = svg.viewBox.baseVal;
		const zoom = this.zoomLevel();

		canvas.style.width = `${viewBox.width * zoom}px`;

		canvas.style.height = `${viewBox.height * zoom}px`;

		container.style.transform = `scale(${zoom})`;
	}

	protected zoom(event: WheelEvent): void {
		event.preventDefault();

		const viewport = this.mapViewport()?.nativeElement;
		const svg = this.mapContainer()?.nativeElement.querySelector('svg');

		if (!viewport || !svg) {
			return;
		}

		const oldZoom = this.zoomLevel();

		const newZoom = Math.min(
			this.maximumZoom,
			Math.max(this.minimumZoom, event.deltaY < 0 ? oldZoom * this.zoomFactor : oldZoom / this.zoomFactor)
		);

		if (newZoom === oldZoom) {
			return;
		}

		const rect = viewport.getBoundingClientRect();

		const mouseX = event.clientX - rect.left - viewport.clientLeft;

		const mouseY = event.clientY - rect.top - viewport.clientTop;

		const scale = newZoom / oldZoom;

		const scrollLeft = (viewport.scrollLeft + mouseX) * scale - mouseX;

		const scrollTop = (viewport.scrollTop + mouseY) * scale - mouseY;

		this.zoomLevel.set(newZoom);

		this.updateCanvasSize(svg);

		viewport.scrollLeft = scrollLeft;
		viewport.scrollTop = scrollTop;
	}

	protected startPan(event: PointerEvent): void {
		if (event.button !== 0) {
			return;
		}

		const viewport = this.mapViewport()?.nativeElement;

		if (!viewport) {
			return;
		}

		this.isPanning = true;
		this.hasDragged = false;

		this.panStartX = event.clientX;
		this.panStartY = event.clientY;

		this.panStartScrollLeft = viewport.scrollLeft;
		this.panStartScrollTop = viewport.scrollTop;
	}

	protected pan(event: PointerEvent): void {
		if (!this.isPanning) {
			return;
		}

		const viewport = this.mapViewport()?.nativeElement;

		if (!viewport) {
			return;
		}

		const deltaX = event.clientX - this.panStartX;
		const deltaY = event.clientY - this.panStartY;

		if (!this.hasDragged && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
			this.hasDragged = true;

			viewport.setPointerCapture(event.pointerId);
		}

		if (!this.hasDragged) {
			return;
		}

		viewport.scrollLeft = this.panStartScrollLeft - deltaX;

		viewport.scrollTop = this.panStartScrollTop - deltaY;
	}

	protected stopPan(event: PointerEvent): void {
		if (!this.isPanning) {
			return;
		}

		const viewport = this.mapViewport()?.nativeElement;

		if (viewport?.hasPointerCapture(event.pointerId)) {
			viewport.releasePointerCapture(event.pointerId);
		}

		this.isPanning = false;

		if (this.hasDragged) {
			this.suppressClick = true;
		}
	}

	/**
	 * Exports the current star map as an SVG file.
	 */
	public async exportSvg(): Promise<void> {
		const map = this.store.map();

		const svg = this.mapContainer()?.nativeElement.querySelector('svg');

		if (!map || !svg) {
			return;
		}

		await this.svgExportService.export(svg, map.name);
	}

	/**
	 * Fits the star map to the viewport, adjusting the zoom level and canvas size accordingly.
	 */
	public fitToViewport(): void {
		const viewport = this.mapViewport()?.nativeElement;
		const canvas = this.mapCanvas()?.nativeElement;
		const container = this.mapContainer()?.nativeElement;
		const svg = container?.querySelector('svg');

		if (!viewport || !canvas || !container || !svg) {
			return;
		}

		const viewBox = svg.viewBox.baseVal;

		if (viewBox.width === 0 || viewBox.height === 0) {
			return;
		}

		// Vor der Messung auf den unskalierten Zustand zurücksetzen.
		container.style.transform = 'none';
		canvas.style.width = `${viewBox.width}px`;
		canvas.style.height = `${viewBox.height}px`;

		const padding = 32;

		const availableWidth = Math.max(0, viewport.clientWidth - padding * 2);

		const availableHeight = Math.max(0, viewport.clientHeight - padding * 2);

		const horizontalZoom = availableWidth / viewBox.width;

		const verticalZoom = availableHeight / viewBox.height;

		const zoom = Math.min(this.maximumZoom, Math.max(this.minimumZoom, Math.min(horizontalZoom, verticalZoom)));

		this.zoomLevel.set(zoom);
		this.updateCanvasSize(svg);

		viewport.scrollLeft = 0;
		viewport.scrollTop = 0;
	}
}
