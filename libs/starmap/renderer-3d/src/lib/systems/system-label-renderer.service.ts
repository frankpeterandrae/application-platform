/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { StarSystem } from '@application-platform/starmap-domain';
import { Group, Scene } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { Starmap3dPositionService } from '../util/starmap-3d-position.service';

import { SystemLabelBounds } from './system-label-collision.service';

/**
 * Renders labels for star systems into the Three.js scene.
 */
@Injectable({
	providedIn: 'root'
})
export class SystemLabelRendererService {
	private readonly positionService = inject(Starmap3dPositionService);
	private readonly group = new Group();
	private readonly labels = new Map<string, CSS2DObject>();
	/**
	 * Renders labels for all given star systems.
	 * @param scene The Three.js scene to render into.
	 * @param systems The star systems to label.
	 */
	public render(scene: Scene, systems: readonly StarSystem[]): void {
		this.clear();

		if (!scene.children.includes(this.group)) {
			scene.add(this.group);
		}

		for (const system of systems) {
			this.group.add(this.createLabel(system));
		}
	}

	/**
	 * Removes all rendered labels.
	 */
	public clear(): void {
		this.group.clear();
		this.labels.clear();
	}

	/**
	 * Updates the visibility of labels based on the provided set of visible system IDs.
	 * @param visibleSystemIds A set of system IDs that should be visible.
	 */
	public updateVisibility(visibleSystemIds: ReadonlySet<string>): void {
		for (const [systemId, label] of this.labels) {
			label.visible = visibleSystemIds.has(systemId);
		}
	}

	private createLabel(system: StarSystem): CSS2DObject {
		const element = document.createElement('div');

		element.className = 'star-system-label';
		element.textContent = system.name;
		element.style.color = '#ffffff';
		element.style.fontSize = '16px';
		element.style.whiteSpace = 'nowrap';
		element.style.textShadow = '0 1px 3px #000000';

		const label = new CSS2DObject(element);
		const position = this.positionService.toVector3(system.position);

		label.position.copy(position);

		this.labels.set(system.id, label);

		return label;
	}

	/**
	 * Gets the current screen-space bounds for the requested labels.
	 * @param systemIds System IDs ordered by label priority.
	 * @returns Current screen-space bounds of the labels.
	 */
	public getLabelBounds(systemIds: ReadonlySet<string>): SystemLabelBounds[] {
		const bounds: SystemLabelBounds[] = [];

		for (const systemId of systemIds) {
			const label = this.labels.get(systemId);

			if (!label) {
				continue;
			}

			const rect = label.element.getBoundingClientRect();

			bounds.push({
				systemId,
				left: rect.left,
				top: rect.top,
				right: rect.right,
				bottom: rect.bottom
			});
		}

		return bounds;
	}
}
