/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { setupTestingModule } from '../../test-setup';

import { DashboardContainerComponent } from './dashboard-container.component';

describe('DashboardContainerComponent', () => {
	let component: DashboardContainerComponent;
	let fixture: ComponentFixture<DashboardContainerComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [DashboardContainerComponent],
			providers: [provideRouter([])]
		});

		fixture = TestBed.createComponent(DashboardContainerComponent);

		component = fixture.componentInstance;

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should provide dashboard menu items', () => {
		expect(component.menuItems).toEqual([
			{
				id: 'button',
				label: 'Farbauswahl',
				route: '../paints'
			},
			{
				id: 'paint-editor',
				label: 'Farbeditor',
				route: '../paint-editor'
			},
			{
				id: 'stream-info',
				label: 'Stream Info',
				route: '../stream-info'
			}
		]);
	});
});
