/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarSystem } from '@application-platform/starmap-domain';
import { Group, Mesh, MeshBasicMaterial, Object3D, Scene, SphereGeometry } from 'three';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';
import { STARMAP_3D_SCALE } from '../rendering/starmap-3d-scale';

import { SystemRendererService } from './system-renderer.service';

describe('SystemRendererService', () => {
	let service: SystemRendererService;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [SystemRendererService]
		});

		service = TestBed.inject(SystemRendererService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should render systems at their positions', () => {
		const scene = new Scene();

		const systems: StarSystem[] = [
			{
				id: 'S001',
				name: 'Alpha',
				position: {
					x: 1,
					y: 2,
					z: 3
				},
				stars: [{ spectralType: 'G2' }],
				planets: []
			},
			{
				id: 'S002',
				name: 'Beta',
				position: {
					x: -4,
					y: 5,
					z: -6
				},
				stars: [{ spectralType: 'M5' }],
				planets: []
			}
		];

		service.render(scene, systems);

		const systemRendererGroup = scene.children[0] as Group;

		expect(systemRendererGroup.children).toHaveLength(2);

		const firstSystem = systemRendererGroup.children[0] as Group;
		const secondSystem = systemRendererGroup.children[1] as Group;

		expect(firstSystem).toBeInstanceOf(Group);
		expect(firstSystem.position.toArray()).toEqual([3, 6, 9]);

		expect(secondSystem).toBeInstanceOf(Group);
		expect(secondSystem.position.toArray()).toEqual([-12, 15, -18]);

		expect(firstSystem.children).toHaveLength(1);
		expect(secondSystem.children).toHaveLength(1);
		expect(firstSystem.children[0]).toBeInstanceOf(Group);
		expect(secondSystem.children[0]).toBeInstanceOf(Group);

		const firstStar = getStarGroup(firstSystem);
		const secondStar = getStarGroup(secondSystem);

		expect(firstStar.children).toHaveLength(2);
		expect(secondStar.children).toHaveLength(2);

		expect(getStarGlow(firstStar)).toBeInstanceOf(Mesh);
		expect(getStarCore(firstStar)).toBeInstanceOf(Mesh);
	});

	it('should render star color and size based on spectral type', () => {
		const scene = new Scene();

		service.render(scene, [
			{
				id: 'S001',
				name: 'Sol',
				position: {
					x: 0,
					y: 0,
					z: 0
				},
				stars: [{ spectralType: 'G2' }],
				planets: []
			}
		]);

		const systemGroup = getSystemGroup(scene);
		const starGroup = getStarGroup(systemGroup);
		const star = getStarCore(starGroup);

		const geometry = star.geometry as SphereGeometry;
		const material = star.material as MeshBasicMaterial;

		expect(geometry.parameters.radius).toBe(0.5 * STARMAP_3D_SCALE.starSize);

		expect(material.color.getHex()).toBe(0xfffa72);
	});

	it('should reuse the system group when rendering again', () => {
		const scene = new Scene();

		const firstSystems: StarSystem[] = [
			{
				id: 'S001',
				name: 'Alpha',
				position: {
					x: 1,
					y: 2,
					z: 3
				},
				stars: [],
				planets: []
			}
		];

		service.render(scene, firstSystems);

		const group = scene.children[0] as Group;

		const secondSystems: StarSystem[] = [
			{
				id: 'S002',
				name: 'Beta',
				position: {
					x: 4,
					y: 5,
					z: 6
				},
				stars: [],
				planets: []
			},
			{
				id: 'S003',
				name: 'Gamma',
				position: {
					x: 7,
					y: 8,
					z: 9
				},
				stars: [],
				planets: []
			}
		];

		service.render(scene, secondSystems);

		expect(scene.children).toHaveLength(1);

		expect(scene.children[0]).toBe(group);

		expect(group.children).toHaveLength(2);
	});

	it('should dispose mesh resources when cleared', () => {
		const scene = new Scene();

		service.render(scene, [
			{
				id: 'S001',
				name: 'Alpha',
				position: {
					x: 1,
					y: 2,
					z: 3
				},
				stars: [],
				planets: []
			}
		]);

		const systemGroup = getSystemGroup(scene);
		const starGroup = getStarGroup(systemGroup);

		const glow = getStarGlow(starGroup);
		const core = getStarCore(starGroup);

		const glowGeometryDispose = vi.spyOn(glow.geometry, 'dispose');
		const coreGeometryDispose = vi.spyOn(core.geometry, 'dispose');

		const glowMaterial = glow.material as MeshBasicMaterial;
		const coreMaterial = core.material as MeshBasicMaterial;

		const glowMaterialDispose = vi.spyOn(glowMaterial, 'dispose');
		const coreMaterialDispose = vi.spyOn(coreMaterial, 'dispose');

		service.clear();

		expect(glowGeometryDispose).toHaveBeenCalledOnce();
		expect(coreGeometryDispose).toHaveBeenCalledOnce();

		expect(glowMaterialDispose).toHaveBeenCalledOnce();
		expect(coreMaterialDispose).toHaveBeenCalledOnce();
	});

	it('should dispose all materials of meshes with multiple materials', () => {
		const scene = new Scene();

		service.render(scene, []);

		const group = scene.children[0] as Group;

		const geometry = new SphereGeometry();

		const firstMaterial = new MeshBasicMaterial();

		const secondMaterial = new MeshBasicMaterial();

		const geometryDispose = vi.spyOn(geometry, 'dispose');

		const firstDispose = vi.spyOn(firstMaterial, 'dispose');

		const secondDispose = vi.spyOn(secondMaterial, 'dispose');

		group.add(new Mesh(geometry, [firstMaterial, secondMaterial]));

		service.clear();

		expect(geometryDispose).toHaveBeenCalledOnce();

		expect(firstDispose).toHaveBeenCalledOnce();

		expect(secondDispose).toHaveBeenCalledOnce();
	});

	it('should remove non-mesh objects when cleared', () => {
		const scene = new Scene();

		service.render(scene, []);

		const group = scene.children[0] as Group;

		group.add(new Object3D());

		service.clear();

		expect(group.children).toHaveLength(0);
	});

	it('should offset stars in multi-star systems', () => {
		const scene = new Scene();

		service.render(scene, [
			{
				id: 'S001',
				name: 'Binary',
				position: { x: 0, y: 0, z: 0 },
				stars: [{ spectralType: 'G2' }, { spectralType: 'K5' }],
				planets: []
			}
		]);

		const rendererGroup = scene.children[0] as Group;
		const systemGroup = rendererGroup.children[0] as Group;

		const firstStar = systemGroup.children[0] as Mesh;
		const secondStar = systemGroup.children[1] as Mesh;

		expect(firstStar.position.toArray()).toEqual([-0.2, 0, 0]);
		expect(secondStar.position.toArray()).toEqual([0.2, 0, 0]);
	});

	it('should keep stars in multi-star systems separated', () => {
		const scene = new Scene();

		service.render(scene, [
			{
				id: 'S001',
				name: 'Binary',
				position: { x: 0, y: 0, z: 0 },
				stars: [{ spectralType: 'G2' }, { spectralType: 'M5' }],
				planets: []
			}
		]);

		const systemGroup = getSystemGroup(scene);

		const firstStar = getStarGroup(systemGroup, 0);
		const secondStar = getStarGroup(systemGroup, 1);

		const firstCore = getStarCore(firstStar);
		const secondCore = getStarCore(secondStar);

		const firstRadius = (firstCore.geometry as SphereGeometry).parameters.radius;

		const secondRadius = (secondCore.geometry as SphereGeometry).parameters.radius;

		const distance = firstStar.position.distanceTo(secondStar.position);

		expect(distance).toBeGreaterThan(firstRadius + secondRadius);
	});

	it('should distribute multiple stars around the system center', () => {
		const scene = new Scene();

		service.render(scene, [
			{
				id: 'S001',
				name: 'Triple',
				position: { x: 0, y: 0, z: 0 },
				stars: [{ spectralType: 'G2' }, { spectralType: 'K5' }, { spectralType: 'M3' }],
				planets: []
			}
		]);

		const rendererGroup = scene.children[0] as Group;
		const systemGroup = rendererGroup.children[0] as Group;

		expect(systemGroup.children).toHaveLength(3);

		for (const star of systemGroup.children) {
			expect(star.position.length()).toBeGreaterThan(0);
		}
	});

	it('should render a glow and a core for a star', () => {
		const scene = new Scene();

		service.render(scene, [
			{
				id: 'S001',
				name: 'Sol',
				position: { x: 0, y: 0, z: 0 },
				stars: [{ spectralType: 'G2' }],
				planets: []
			}
		]);

		const rendererGroup = scene.children[0] as Group;
		const systemGroup = rendererGroup.children[0] as Group;
		const starGroup = systemGroup.children[0] as Group;

		expect(starGroup.children).toHaveLength(2);

		const glow = starGroup.children[0] as Mesh;
		const core = starGroup.children[1] as Mesh;

		const glowRadius = (glow.geometry as SphereGeometry).parameters.radius;
		const coreRadius = (core.geometry as SphereGeometry).parameters.radius;

		expect(glowRadius).toBeGreaterThan(coreRadius);

		const glowMaterial = glow.material as MeshBasicMaterial;

		expect(glowMaterial.transparent).toBe(true);
		expect(glowMaterial.opacity).toBeGreaterThan(0);
	});

	function getSystemGroup(scene: Scene, index = 0): Group {
		const rendererGroup = scene.children[0] as Group;

		return rendererGroup.children[index] as Group;
	}

	function getStarGroup(systemGroup: Group, index = 0): Group {
		return systemGroup.children[index] as Group;
	}

	function getStarGlow(starGroup: Group): Mesh {
		return starGroup.children[0] as Mesh;
	}

	function getStarCore(starGroup: Group): Mesh {
		return starGroup.children[1] as Mesh;
	}
});
