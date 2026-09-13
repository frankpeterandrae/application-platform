/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { JumpLink, JumpLinkStatus, StarSystem } from '@application-platform/starmap-domain';
import { BufferGeometry, Group, Line, LineBasicMaterial, LineDashedMaterial, Material, Scene } from 'three';

import { STARMAP_3D_SCALE } from '../rendering/starmap-3d-scale';
import { Starmap3dPositionService } from '../util/starmap-3d-position.service';

/**
 * Renders jump links between star systems into a Three.js scene.
 */
@Injectable({
	providedIn: 'root'
})
export class JumpLinkRendererService {
	private readonly positionService = inject(Starmap3dPositionService);

	private readonly group = new Group();

	private readonly styles: Record<
		JumpLinkStatus,
		{
			color: number;
			dash?: {
				dashSize: number;
				gapSize: number;
			};
		}
	> = {
		normal: {
			color: 0x464646
		},
		caution: {
			color: 0xffd43b,
			dash: {
				dashSize: 0.8,
				gapSize: 0.5
			}
		},
		dangerous: {
			color: 0xff7a00
		},
		blocked: {
			color: 0xff3b30,
			dash: {
				dashSize: 0.25,
				gapSize: 0.4
			}
		},
		lost: {
			color: 0x0033cc,
			dash: {
				dashSize: 0.25,
				gapSize: 0.4
			}
		}
	};

	/**
	 * Renders the given jump links into the provided Three.js scene.
	 * @param scene The Three.js scene to render into.
	 * @param systems The available star systems.
	 * @param jumpLinks The jump links to render.
	 */
	public render(scene: Scene, systems: StarSystem[], jumpLinks: JumpLink[]): void {
		this.clear();

		if (!scene.children.includes(this.group)) {
			scene.add(this.group);
		}

		for (const jumpLink of jumpLinks) {
			const line = this.createJumpLink(jumpLink, systems);

			if (line) {
				this.group.add(line);
			}
		}
	}

	/**
	 * Clears all rendered jump links.
	 */
	public clear(): void {
		for (const child of this.group.children) {
			if (child instanceof Line) {
				child.geometry.dispose();

				if (Array.isArray(child.material)) {
					for (const material of child.material) {
						material.dispose();
					}
				} else {
					child.material.dispose();
				}
			}

			this.group.remove(child);
		}
	}

	private createJumpLink(jumpLink: JumpLink, systems: StarSystem[]): Line | null {
		const startSystem = systems.find((system) => system.id === jumpLink.startSystemId);

		const endSystem = systems.find((system) => system.id === jumpLink.endSystemId);

		if (!startSystem || !endSystem || startSystem.id === endSystem.id) {
			return null;
		}

		const start = this.positionService.toVector3(startSystem.position);
		const end = this.positionService.toVector3(endSystem.position);

		const direction = end.clone().sub(start);
		const distance = direction.length();

		if (distance === 0) {
			return null;
		}

		direction.normalize();

		const gap = Math.min(STARMAP_3D_SCALE.jumpLinkSystemGap, distance * 0.4);

		start.addScaledVector(direction, gap);
		end.addScaledVector(direction, -gap);

		const geometry = new BufferGeometry().setFromPoints([start, end]);

		const line = new Line(geometry, this.createMaterial(jumpLink.status));

		if (line.material instanceof LineDashedMaterial) {
			line.computeLineDistances();
		}

		return line;
	}

	private createMaterial(status: JumpLinkStatus): Material {
		const style = this.styles[status];

		if (style.dash) {
			return new LineDashedMaterial({
				color: style.color,
				dashSize: style.dash.dashSize,
				gapSize: style.dash.gapSize
			});
		}

		return new LineBasicMaterial({
			color: style.color
		});
	}
}
