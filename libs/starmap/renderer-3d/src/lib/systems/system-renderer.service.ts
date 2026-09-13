/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { StarSystem } from '@application-platform/starmap-domain';
import { AdditiveBlending, Color, Group, Mesh, MeshBasicMaterial, Object3D, Scene, SphereGeometry, Vector3 } from 'three';

import { STARMAP_3D_SCALE } from '../rendering/starmap-3d-scale';

interface StarRenderData {
	size: number;
	color: number;
}

/**
 * Renders star systems into a Three.js scene.
 */
@Injectable({
	providedIn: 'root'
})
export class SystemRendererService {
	private readonly group = new Group();
	private readonly starGap = 0.25;

	private readonly starRenderData = new Map<string, StarRenderData>([
		['O', { size: 0.75, color: 0x1345ff }],
		['B', { size: 0.75, color: 0x1345ff }],
		['A', { size: 0.5, color: 0x2256ff }],
		['F', { size: 0.5, color: 0x607aff }],
		['G', { size: 0.5, color: 0xfffa72 }],
		['K', { size: 0.5, color: 0xff9228 }],
		['M', { size: 0.25, color: 0xff7e00 }],
		['BD', { size: 0.2, color: 0xff26b0 }],
		['WD', { size: 0.25, color: 0x1345ff }],
		['NS', { size: 0.375, color: 0xc86400 }],
		['BH', { size: 0.375, color: 0x000000 }]
	]);

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
			this.disposeObject(child);
			this.group.remove(child);
		}
	}

	private createSystem(system: StarSystem): Group {
		const group = new Group();

		group.position.set(
			system.position.x * STARMAP_3D_SCALE.systemDistance,
			system.position.y * STARMAP_3D_SCALE.systemDistance,
			system.position.z * STARMAP_3D_SCALE.systemDistance
		);

		if (system.stars.length === 0) {
			group.add(this.createStar(''));

			return group;
		}

		const radii = system.stars.map((star) => this.getStarRadius(star.spectralType));

		const offsets = this.getStarOffsets(radii);

		system.stars.forEach((star, index) => {
			const starObject = this.createStar(star.spectralType);

			starObject.position.copy(offsets[index]);

			group.add(starObject);
		});

		return group;
	}

	private createStar(spectralType: string): Group {
		const group = new Group();

		const renderData = this.getStarRenderData(spectralType);
		const radius = this.getStarRadius(spectralType);

		const coreGeometry = new SphereGeometry(radius, 16, 16);
		const coreMaterial = new MeshBasicMaterial({
			color: renderData.color
		});

		const core = new Mesh(coreGeometry, coreMaterial);

		const glowGeometry = new SphereGeometry(radius * this.getGlowScale(renderData.size), 16, 16);

		const glowMaterial = new MeshBasicMaterial({
			color: this.getGlowColor(renderData.color),
			transparent: true,
			opacity: this.getGlowOpacity(renderData.size),
			blending: AdditiveBlending,
			depthWrite: false
		});

		const glow = new Mesh(glowGeometry, glowMaterial);

		group.add(glow, core);

		return group;
	}

	private getGlowScale(baseSize: number): number {
		if (baseSize >= 1) {
			return 3;
		}

		if (baseSize >= 0.75) {
			return 2.6;
		}

		if (baseSize >= 0.5) {
			return 2.2;
		}

		return 1.8;
	}

	private getGlowOpacity(baseSize: number): number {
		if (baseSize >= 1) {
			return 0.24;
		}

		if (baseSize >= 0.75) {
			return 0.2;
		}

		if (baseSize >= 0.5) {
			return 0.16;
		}

		return 0.12;
	}

	private getGlowColor(color: number): number {
		const glow = new Color(color);

		glow.lerp(new Color(0xffffff), 0.35);

		return glow.getHex();
	}

	private getStarRadius(spectralType: string): number {
		return this.getStarRenderData(spectralType).size * STARMAP_3D_SCALE.starSize;
	}

	private getStarRenderData(spectralType: string): StarRenderData {
		const specialType = this.starRenderData.get(spectralType);

		if (specialType) {
			return specialType;
		}

		const spectralClass = spectralType.substring(0, 1);
		const renderData = this.starRenderData.get(spectralClass) ?? {
			size: 0.25,
			color: 0xffffff
		};

		if (spectralType.endsWith('III')) {
			return {
				...renderData,
				size: 0.75
			};
		}

		if (spectralType.endsWith('I')) {
			return {
				...renderData,
				size: 1
			};
		}

		return renderData;
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

	private getStarOffsets(radii: readonly number[]): Vector3[] {
		if (radii.length === 0) {
			return [];
		}

		if (radii.length === 1) {
			return [new Vector3()];
		}

		if (radii.length === 2) {
			const distance = radii[0] + radii[1] + this.starGap;

			return [new Vector3(-distance / 2, 0, 0), new Vector3(distance / 2, 0, 0)];
		}

		const maxRadius = Math.max(...radii);

		const minimumDistance = maxRadius * 2 + this.starGap;

		const ringRadius = minimumDistance / (2 * Math.sin(Math.PI / radii.length));

		return radii.map((_, index) => {
			const angle = (index / radii.length) * Math.PI * 2 - Math.PI / 2;

			return new Vector3(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
		});
	}
}
