/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { environment } from '@application-platform/config';
import { LanguageToggleComponent } from '@application-platform/shared/ui-theme';
import { MockedLanguageToggleComponent } from '@application-platform/testing';
import { of } from 'rxjs';

import { setupTestingModule } from '../test-setup';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
	let fixture: ComponentFixture<AppComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [AppComponent],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						params: of({}),
						snapshot: {
							paramMap: {
								get: (): any => null
							}
						}
					}
				},
				{ provide: LanguageToggleComponent, useClass: MockedLanguageToggleComponent }
			]
		});

		fixture = TestBed.createComponent(AppComponent);
	});

	it('should create the app', () => {
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should initialize menu items with translations', fakeAsync(() => {
		const app = fixture.componentInstance;
		app.ngOnInit();
		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();

		expect(app.menuItems.length).toBeGreaterThan(0);
	}));

	it('should include "In Development" menu item in non-production mode', fakeAsync(() => {
		environment.production = false;
		const app = fixture.componentInstance;
		app.ngOnInit();
		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();

		// environment.production is explicitly set to false above, so assert directly
		expect(app.menuItems.some((item) => item.label === 'AppComponent.menu.lbl.InDevelopment')).toBe(true);
	}));

	it('should not include "In Development" menu item in production mode', fakeAsync(() => {
		const app = fixture.componentInstance;
		environment.production = true;
		app.ngOnInit();

		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();

		// environment.production is explicitly set to true above, so assert directly
		expect(app.menuItems.some((item) => item.label === 'AppComponent.menu.lbl.InDevelopment')).toBe(false);
	}));

	it('should have correct route for "Home" menu item', fakeAsync(() => {
		const app = fixture.componentInstance;
		app.ngOnInit();
		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		const homeItem = app.menuItems.find((item) => item.label === 'AppComponent.menu.lbl.Home');
		expect(homeItem?.route).toBe('/');
	}));

	it('should have correct route for "Paint Rack" menu item', fakeAsync(() => {
		const app = fixture.componentInstance;
		app.ngOnInit();
		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		const paintRackItem = app.menuItems.find((item) => item.label === 'AppComponent.menu.lbl.PaintRack');
		expect(paintRackItem?.route).toBe('/paint-rack');
	}));
});
