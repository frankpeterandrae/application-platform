/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { Nebula, NebulaNode } from '@application-platform/starmap-domain';
import { Box3, Material, Vector3 } from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

import { STARMAP_3D_SCALE } from '../rendering/starmap-3d-scale';
import { Starmap3dPositionService } from '../util/starmap-3d-position.service';

interface NebulaSample {
	position: Vector3;
	radius: number;
}

/**
 * Service responsible for creating and updating metaball representations of nebulae in a Three.js scene.
 */
@Injectable({
	providedIn: 'root'
})
export class NebulaMetaballService {
	private readonly positionService = inject(Starmap3dPositionService);

	private readonly resolution = 40;
	private readonly subtract = 12;

	/**
	 * Input parameters used by the nebula metaball service.
	 *
	 * @param nebula - The nebula domain object containing the data required to generate or update the metaball representation.
	 * @param material - The rendering material applied to the generated nebula * metaball mesh.
	 */
	public create(nebula: Nebula, material: Material): MarchingCubes | null {
		const samples = this.createSamples(nebula);

		if (samples.length === 0) {
			return null;
		}

		const bounds = this.createBounds(samples);

		const size = bounds.getSize(new Vector3());
		const center = bounds.getCenter(new Vector3());

		const extent = Math.max(size.x, size.y, size.z);

		if (extent === 0) {
			return null;
		}

		const marchingCubes = new MarchingCubes(this.resolution, material, false, false);

		marchingCubes.reset();

		for (const sample of samples) {
			const normalizedPosition = this.normalizePosition(sample.position, bounds, extent);

			const normalizedRadius = sample.radius / extent;

			const strength = this.subtract * normalizedRadius * normalizedRadius;

			marchingCubes.addBall(normalizedPosition.x, normalizedPosition.y, normalizedPosition.z, strength, this.subtract);
		}

		marchingCubes.update();

		marchingCubes.scale.setScalar(extent / 2);
		marchingCubes.position.copy(center);

		return marchingCubes;
	}

	private createSamples(nebula: Nebula): NebulaSample[] {
		const samples: NebulaSample[] = nebula.nodes.map((node) => this.createNodeSample(node));

		for (const connection of nebula.connections) {
			const from = nebula.nodes.find((node) => node.id === connection.from);

			const to = nebula.nodes.find((node) => node.id === connection.to);

			if (!from || !to) {
				continue;
			}

			samples.push(...this.createConnectionSamples(from, to));
		}

		return samples;
	}

	private createNodeSample(node: NebulaNode): NebulaSample {
		return {
			position: this.positionService.toVector3(node.position),
			radius: node.radius * STARMAP_3D_SCALE.systemDistance
		};
	}

	private createConnectionSamples(from: NebulaNode, to: NebulaNode): NebulaSample[] {
		const start = this.positionService.toVector3(from.position);

		const end = this.positionService.toVector3(to.position);

		const fromRadius = from.radius * STARMAP_3D_SCALE.systemDistance;

		const toRadius = to.radius * STARMAP_3D_SCALE.systemDistance;

		const distance = start.distanceTo(end);

		const sampleDistance = Math.max(Math.min(fromRadius, toRadius) * 0.5, 0.5);

		const steps = Math.max(2, Math.ceil(distance / sampleDistance));

		const samples: NebulaSample[] = [];

		for (let index = 1; index < steps; index++) {
			const t = index / steps;

			samples.push({
				position: start.clone().lerp(end, t),
				radius: fromRadius + (toRadius - fromRadius) * t
			});
		}

		return samples;
	}

	private createBounds(samples: NebulaSample[]): Box3 {
		const bounds = new Box3();

		for (const sample of samples) {
			const radius = new Vector3(sample.radius, sample.radius, sample.radius);

			bounds.expandByPoint(sample.position.clone().sub(radius));

			bounds.expandByPoint(sample.position.clone().add(radius));
		}

		return bounds;
	}

	private normalizePosition(position: Vector3, bounds: Box3, extent: number): Vector3 {
		const center = bounds.getCenter(new Vector3());

		return position.clone().sub(center).divideScalar(extent).addScalar(0.5);
	}
}
