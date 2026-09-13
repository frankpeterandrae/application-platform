/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { StarSystem } from '@application-platform/starmap-domain';
import { Group, Mesh, MeshBasicMaterial, Scene, SphereGeometry } from 'three';

/**
 * Renders star systems into a Three.js scene.
 */
@Injectable({
	providedIn: 'root'
})
export class SystemRendererService {
	private readonly group = new Group();

	/**
	 * Renders the given star systems into the provided Three.js scene.
	 * @param scene The Three.js scene to render into.
	 * @param systems The star systems to render.
	 */
	public render(scene: Scene, systems: StarSystem[]): void {
		this.clear();

		if (!scene.children.includes(this.group)) {
			scene.add(this.group);
		}

		for (const system of systems) {
			this.group.add(this.createSystem(system));
		}
	}

	/**
	 * Clears all rendered star systems from the scene.
	 */
	public clear(): void {
		for (const child of this.group.children) {
			this.group.remove(child);

			if (child instanceof Mesh) {
				child.geometry.dispose();

				if (Array.isArray(child.material)) {
					for (const material of child.material) {
						material.dispose();
					}
				} else {
					child.material.dispose();
				}
			}
		}
	}

	private createSystem(system: StarSystem): Mesh {
		const geometry = new SphereGeometry(0.25, 16, 16);

		const material = new MeshBasicMaterial({
			color: 0xffffff
		});

		const mesh = new Mesh(geometry, material);

		mesh.position.set(system.position.x, system.position.y, system.position.z);

		return mesh;
	}
}
