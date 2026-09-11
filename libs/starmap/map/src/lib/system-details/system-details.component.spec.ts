/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanetType, StarSystem } from '@application-platform/starmap-domain';

import { setupTestingModule } from '../../test-setup';

import { SystemDetailsComponent } from './system-details.component';

describe('SystemDetailsComponent', () => {
	let component: SystemDetailsComponent;
	let fixture: ComponentFixture<SystemDetailsComponent>;
	beforeEach(async () => {
		await setupTestingModule({
			imports: [SystemDetailsComponent]
		});

		fixture = TestBed.createComponent(SystemDetailsComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('system', {
			id: 'S001',
			name: 'Alpha System',
			position: { x: 1, y: 2, z: 3 },
			stars: [],
			planets: []
		} satisfies StarSystem);

		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('should return the readable planet type label', () => {
		expect((component as any).planetTypeLabel('unknown' as PlanetType)).toBe('unknown');
		expect((component as any).planetTypeLabel('gas_giant')).toBe('Gasriese');
	});
});
