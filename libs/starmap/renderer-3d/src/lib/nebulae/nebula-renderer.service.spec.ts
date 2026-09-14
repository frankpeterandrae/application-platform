/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { Nebula, NebulaType } from '@application-platform/starmap-domain';
import { MeshBasicMaterial, Scene, ShaderMaterial } from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { vi } from 'vitest';

import { setupTestingModule } from '../../test-setup';

import { NebulaMetaballService } from './nebula-metaball.service';
import { NebulaRendererService } from './nebula-renderer.service';

describe('NebulaRendererService', () => {
	let service: NebulaRendererService;
	let metaballService: NebulaMetaballService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(NebulaRendererService);
		metaballService = TestBed.inject(NebulaMetaballService);
	});

	function createNebula(style: NebulaType): Nebula {
		return {
			id: 'N001',
			name: 'Test Nebula',
			style,
			color: '#123456',
			opacity: 0.5,
			nodes: [
				{
					id: 'node-1',
					position: { x: 0, y: 0, z: 0 },
					radius: 1
				}
			],
			connections: []
		};
	}

	function mockMetaball(): MarchingCubes {
		return new MarchingCubes(8, new MeshBasicMaterial(), false, false);
	}

	it('should add rendered nebulae to the scene', () => {
		const scene = new Scene();
		const mesh = mockMetaball();

		vi.spyOn(metaballService, 'create').mockReturnValue(mesh);

		service.render(scene, [createNebula('cloud')]);

		expect(scene.children).toHaveLength(1);
		expect(scene.children[0].children).toHaveLength(1);
		expect(scene.children[0].children[0].name).toBe('Test Nebula');
	});

	it('should use a basic material for cloud nebulae', () => {
		const scene = new Scene();

		vi.spyOn(metaballService, 'create').mockImplementation((_nebula, material) => {
			expect(material).toBeInstanceOf(MeshBasicMaterial);

			expect((material as MeshBasicMaterial).opacity).toBe(0.5);

			return mockMetaball();
		});

		service.render(scene, [createNebula('cloud')]);
	});

	it('should reduce opacity for haze nebulae', () => {
		const scene = new Scene();

		vi.spyOn(metaballService, 'create').mockImplementation((_nebula, material) => {
			expect(material).toBeInstanceOf(MeshBasicMaterial);

			expect((material as MeshBasicMaterial).opacity).toBeCloseTo(0.175);

			return mockMetaball();
		});

		service.render(scene, [createNebula('haze')]);
	});

	it('should use a shader material for outline nebulae', () => {
		const scene = new Scene();

		vi.spyOn(metaballService, 'create').mockImplementation((_nebula, material) => {
			expect(material).toBeInstanceOf(ShaderMaterial);

			const shader = material as ShaderMaterial;

			expect(shader.uniforms['rimPower'].value).toBe(3);

			expect(shader.uniforms['rimStrength'].value).toBe(2);

			return mockMetaball();
		});

		service.render(scene, [createNebula('outline')]);
	});

	it('should skip nebulae without generated geometry', () => {
		const scene = new Scene();

		vi.spyOn(metaballService, 'create').mockReturnValue(null);

		service.render(scene, [createNebula('cloud')]);

		expect(scene.children).toHaveLength(1);
		expect(scene.children[0].children).toHaveLength(0);
	});

	it('should clear previously rendered nebulae', () => {
		const scene = new Scene();

		const first = mockMetaball();
		const second = mockMetaball();

		const createSpy = vi.spyOn(metaballService, 'create').mockReturnValueOnce(first).mockReturnValueOnce(second);

		service.render(scene, [createNebula('cloud')]);

		service.render(scene, [createNebula('cloud')]);

		expect(createSpy).toHaveBeenCalledTimes(2);
		expect(scene.children[0].children).toHaveLength(1);
		expect(scene.children[0].children[0]).toBe(second);
	});
});
