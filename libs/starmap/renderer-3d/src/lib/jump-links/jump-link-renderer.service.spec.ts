/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { JumpLink, StarSystem } from '@application-platform/starmap-domain';
import { Group, Line, LineBasicMaterial, LineDashedMaterial, Scene } from 'three';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { JumpLinkRendererService } from './jump-link-renderer.service';

describe('JumpLinkRendererService', () => {
	let service: JumpLinkRendererService;

	const systems: StarSystem[] = [
		{
			id: 'S001',
			name: 'Alpha',
			position: {
				x: 0,
				y: 0,
				z: 0
			},
			stars: [],
			planets: []
		},
		{
			id: 'S002',
			name: 'Beta',
			position: {
				x: 10,
				y: 0,
				z: 0
			},
			stars: [],
			planets: []
		}
	];

	beforeEach(async () => {
		await setupTestingModule({
			providers: [JumpLinkRendererService]
		});

		service = TestBed.inject(JumpLinkRendererService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should render a jump link between two systems', () => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink('normal')]);

		const group = getRendererGroup(scene);

		expect(group.children).toHaveLength(1);
		expect(group.children[0]).toBeInstanceOf(Line);
	});

	it('should leave a gap between the jump link and both systems', () => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink('normal')]);

		const line = getJumpLink(scene);

		const positions = line.geometry.getAttribute('position');

		const startX = positions.getX(0);
		const endX = positions.getX(1);

		expect(startX).toBeGreaterThan(0);
		expect(endX).toBeLessThan(30);
	});

	it('should skip a jump link with a missing start system', () => {
		const scene = new Scene();

		service.render(scene, systems, [
			{
				...createJumpLink('normal'),
				startSystemId: 'missing'
			}
		]);

		expect(getRendererGroup(scene).children).toHaveLength(0);
	});

	it('should skip a jump link with a missing end system', () => {
		const scene = new Scene();

		service.render(scene, systems, [
			{
				...createJumpLink('normal'),
				endSystemId: 'missing'
			}
		]);

		expect(getRendererGroup(scene).children).toHaveLength(0);
	});

	it('should skip a jump link to the same system', () => {
		const scene = new Scene();

		service.render(scene, systems, [
			{
				...createJumpLink('normal'),
				endSystemId: 'S001'
			}
		]);

		expect(getRendererGroup(scene).children).toHaveLength(0);
	});

	it('should render normal jump links with a basic material', () => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink('normal')]);

		const line = getJumpLink(scene);

		expect(line.material).toBeInstanceOf(LineBasicMaterial);
	});

	it.each(['caution', 'blocked', 'lost'] as const)('should render %s jump links with a dashed material', (status) => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink(status)]);

		const line = getJumpLink(scene);

		expect(line.material).toBeInstanceOf(LineDashedMaterial);
	});

	it('should render dangerous jump links with a basic material', () => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink('dangerous')]);

		const line = getJumpLink(scene);

		expect(line.material).toBeInstanceOf(LineBasicMaterial);
	});

	it('should replace previously rendered jump links', () => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink('normal')]);

		const group = getRendererGroup(scene);

		expect(group.children).toHaveLength(1);

		service.render(scene, systems, []);

		expect(scene.children).toHaveLength(1);
		expect(scene.children[0]).toBe(group);
		expect(group.children).toHaveLength(0);
	});

	it('should update the jump link when a system position changes', () => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink('normal')]);

		const firstLine = getJumpLink(scene);
		const firstPositions = firstLine.geometry.getAttribute('position');

		const firstEndX = firstPositions.getX(1);

		const updatedSystems: StarSystem[] = [
			systems[0],
			{
				...systems[1],
				position: {
					x: 20,
					y: 0,
					z: 0
				}
			}
		];

		service.render(scene, updatedSystems, [createJumpLink('normal')]);

		const updatedLine = getJumpLink(scene);
		const updatedPositions = updatedLine.geometry.getAttribute('position');

		expect(updatedPositions.getX(1)).toBeGreaterThan(firstEndX);
	});

	it('should dispose geometry and material when cleared', () => {
		const scene = new Scene();

		service.render(scene, systems, [createJumpLink('normal')]);

		const line = getJumpLink(scene);

		const geometryDispose = vi.spyOn(line.geometry, 'dispose');

		const material = line.material as LineBasicMaterial;

		const materialDispose = vi.spyOn(material, 'dispose');

		service.clear();

		expect(geometryDispose).toHaveBeenCalledOnce();
		expect(materialDispose).toHaveBeenCalledOnce();

		expect(getRendererGroup(scene).children).toHaveLength(0);
	});

	function createJumpLink(status: JumpLink['status']): JumpLink {
		return {
			id: 'J001',
			startSystemId: 'S001',
			endSystemId: 'S002',
			status
		};
	}

	function getRendererGroup(scene: Scene): Group {
		return scene.children[0] as Group;
	}

	function getJumpLink(scene: Scene): Line {
		return getRendererGroup(scene).children[0] as Line;
	}
});
