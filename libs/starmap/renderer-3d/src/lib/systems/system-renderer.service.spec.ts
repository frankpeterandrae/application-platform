/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarSystem } from '@application-platform/starmap-domain';
import { Group, Mesh, MeshBasicMaterial, Object3D, Scene, SphereGeometry } from 'three';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

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
				stars: [],
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
				stars: [],
				planets: []
			}
		];

		service.render(scene, systems);

		expect(scene.children).toHaveLength(1);

		expect(scene.children[0]).toBeInstanceOf(Group);

		const group = scene.children[0] as Group;

		expect(group.children).toHaveLength(2);

		const first = group.children[0] as Mesh;

		const second = group.children[1] as Mesh;

		expect(first).toBeInstanceOf(Mesh);

		expect(first.position.toArray()).toEqual([1, 2, 3]);

		expect(second.position.toArray()).toEqual([-4, 5, -6]);
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

		const group = scene.children[0] as Group;

		const mesh = group.children[0] as Mesh;

		const geometryDispose = vi.spyOn(mesh.geometry, 'dispose');

		const material = mesh.material as MeshBasicMaterial;

		const materialDispose = vi.spyOn(material, 'dispose');

		service.clear();

		expect(group.children).toHaveLength(0);

		expect(geometryDispose).toHaveBeenCalledOnce();

		expect(materialDispose).toHaveBeenCalledOnce();
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
});
