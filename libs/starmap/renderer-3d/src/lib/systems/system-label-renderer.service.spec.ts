/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { StarSystem } from '@application-platform/starmap-domain';
import { Group, Scene } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { setupTestingModule } from '../../test-setup';
import { Starmap3dPositionService } from '../util/starmap-3d-position.service';

import { SystemLabelRendererService } from './system-label-renderer.service';

describe('SystemLabelRendererService', () => {
	let service: SystemLabelRendererService;

	beforeEach(async () => {
		await setupTestingModule({
			providers: [SystemLabelRendererService, Starmap3dPositionService]
		});

		service = TestBed.inject(SystemLabelRendererService);
	});

	it('should create', () => {
		expect(service).toBeTruthy();
	});

	it('should render labels for star systems', () => {
		const scene = new Scene();

		const systems: StarSystem[] = [createSystem('S001', 'Alpha', 1, 2, 3), createSystem('S002', 'Beta', -4, 5, -6)];

		service.render(scene, systems);

		const group = scene.children[0] as Group;

		expect(group.children).toHaveLength(2);

		const firstLabel = group.children[0] as CSS2DObject;
		const secondLabel = group.children[1] as CSS2DObject;

		expect(firstLabel).toBeInstanceOf(CSS2DObject);
		expect(secondLabel).toBeInstanceOf(CSS2DObject);

		expect(firstLabel.element.textContent).toBe('Alpha');
		expect(secondLabel.element.textContent).toBe('Beta');

		expect(firstLabel.position.toArray()).toEqual([3, -6, 9]);
		expect(secondLabel.position.toArray()).toEqual([-12, -15, -18]);
	});

	it('should apply the label styling', () => {
		const scene = new Scene();

		service.render(scene, [createSystem('S001', 'Alpha', 0, 0, 0)]);

		const label = getLabel(scene);

		expect(label.element.className).toBe('star-system-label');
		expect(label.element.style.color).toBe('rgb(255, 255, 255)');
		expect(label.element.style.fontSize).toBe('16px');
		expect(label.element.style.whiteSpace).toBe('nowrap');
	});

	it('should reuse the label group when rendering again', () => {
		const scene = new Scene();

		service.render(scene, [createSystem('S001', 'Alpha', 0, 0, 0)]);

		const group = scene.children[0];

		service.render(scene, [createSystem('S002', 'Beta', 1, 0, 0), createSystem('S003', 'Gamma', 2, 0, 0)]);

		expect(scene.children).toHaveLength(1);
		expect(scene.children[0]).toBe(group);
		expect(group.children).toHaveLength(2);
	});

	it('should replace previously rendered labels when rendering again', () => {
		const scene = new Scene();

		service.render(scene, [createSystem('S001', 'Alpha', 0, 0, 0)]);

		service.render(scene, [createSystem('S002', 'Beta', 1, 0, 0)]);

		const group = scene.children[0] as Group;

		expect(group.children).toHaveLength(1);

		const label = group.children[0] as CSS2DObject;

		expect(label.element.textContent).toBe('Beta');
	});

	it('should update label visibility', () => {
		const scene = new Scene();

		service.render(scene, [
			createSystem('S001', 'Alpha', 0, 0, 0),
			createSystem('S002', 'Beta', 1, 0, 0),
			createSystem('S003', 'Gamma', 2, 0, 0)
		]);

		service.updateVisibility(new Set(['S001', 'S003']));

		const group = scene.children[0] as Group;

		expect(group.children[0].visible).toBe(true);
		expect(group.children[1].visible).toBe(false);
		expect(group.children[2].visible).toBe(true);
	});

	it('should clear all rendered labels', () => {
		const scene = new Scene();

		service.render(scene, [createSystem('S001', 'Alpha', 0, 0, 0), createSystem('S002', 'Beta', 1, 0, 0)]);

		const group = scene.children[0] as Group;

		service.clear();

		expect(group.children).toHaveLength(0);
	});

	function getLabel(scene: Scene, index = 0): CSS2DObject {
		const group = scene.children[0] as Group;

		return group.children[index] as CSS2DObject;
	}

	function createSystem(id: string, name: string, x: number, y: number, z: number): StarSystem {
		return {
			id,
			name,
			position: {
				x,
				y,
				z
			},
			stars: [],
			planets: []
		};
	}
});
