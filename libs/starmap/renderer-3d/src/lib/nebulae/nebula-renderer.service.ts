/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { Nebula } from '@application-platform/starmap-domain';
import { Color, Group, Material, Mesh, MeshBasicMaterial, Object3D, Scene, ShaderMaterial } from 'three';

import { NebulaMetaballService } from './nebula-metaball.service';

/**
 * Service responsible for rendering nebulae in a Three.js scene.
 */
@Injectable({
	providedIn: 'root'
})
export class NebulaRendererService {
	private readonly metaballService = inject(NebulaMetaballService);

	private readonly group = new Group();

	/**
	 * Renders the given nebulae into the provided Three.js scene.
	 * @param scene The Three.js scene to render into.
	 * @param nebulae The nebulae to render.
	 */
	public render(scene: Scene, nebulae: Nebula[]): void {
		this.clear();

		if (!scene.children.includes(this.group)) {
			scene.add(this.group);
		}

		for (const nebula of nebulae) {
			const material = this.createMaterial(nebula);

			const mesh = this.metaballService.create(nebula, material);

			if (!mesh) {
				material.dispose();
				continue;
			}

			mesh.name = nebula.name;

			this.group.add(mesh);
		}
	}

	/**
	 * Clears all rendered nebulae from the scene and disposes of their resources.
	 */
	public clear(): void {
		for (const child of this.group.children) {
			this.disposeObject(child);
		}

		this.group.clear();
	}

	private createMaterial(nebula: Nebula): Material {
		switch (nebula.style) {
			case 'outline':
				return this.createOutlineMaterial(nebula);

			case 'haze':
				return new MeshBasicMaterial({
					color: nebula.color,
					transparent: true,
					opacity: nebula.opacity * 0.35,
					depthWrite: false
				});

			default:
				return new MeshBasicMaterial({
					color: nebula.color,
					transparent: true,
					opacity: nebula.opacity,
					depthWrite: false
				});
		}
	}

	private createOutlineMaterial(nebula: Nebula): ShaderMaterial {
		return new ShaderMaterial({
			uniforms: {
				color: {
					value: new Color(nebula.color)
				},
				opacity: {
					value: nebula.opacity
				},
				rimPower: {
					value: 3
				},
				rimStrength: {
					value: 2
				}
			},
			vertexShader: `
			varying vec3 vNormal;
			varying vec3 vViewDirection;

			void main() {
				vec4 modelViewPosition =
					modelViewMatrix * vec4(position, 1.0);

				vNormal =
					normalize(normalMatrix * normal);

				vViewDirection =
					normalize(-modelViewPosition.xyz);

				gl_Position =
					projectionMatrix * modelViewPosition;
			}
		`,
			fragmentShader: `
			uniform vec3 color;
			uniform float opacity;
			uniform float rimPower;
			uniform float rimStrength;

			varying vec3 vNormal;
			varying vec3 vViewDirection;

			void main() {
				float facing =
					abs(dot(
						normalize(vNormal),
						normalize(vViewDirection)
					));

				float rim =
					pow(1.0 - facing, rimPower);

				gl_FragColor =
					vec4(
						color,
						rim * opacity * rimStrength
					);
			}
		`,
			transparent: true,
			depthWrite: false
		});
	}

	private disposeObject(object: Object3D): void {
		for (const child of object.children) {
			this.disposeObject(child);
		}

		if (!(object instanceof Mesh)) {
			return;
		}

		object.geometry.dispose();

		if (Array.isArray(object.material)) {
			for (const material of object.material) {
				material.dispose();
			}
		} else {
			object.material.dispose();
		}
	}
}
