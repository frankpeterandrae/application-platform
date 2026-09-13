/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { Scene } from 'three';

import { setupTestingModule } from '../../test-setup';

import { StarMapSceneService } from './star-map-scene.service';

describe('StarMapSceneService', () => {
	let service: StarMapSceneService;

	beforeEach(async () => {
		await setupTestingModule({});

		service = TestBed.inject(StarMapSceneService);
	});

	it('should provide a scene', () => {
		expect(service.getScene()).toBeInstanceOf(Scene);
	});
});
