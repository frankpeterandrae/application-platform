/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '@angular-apps/config';
import { setupTestingModule } from '../test-setup';
import { LanguageToggleComponent } from '@angular-apps/shared/ui-theme';
import { LanguageToggleComponentMock } from '@angular-apps/testing';

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
				{ provide: LanguageToggleComponent, useClass: LanguageToggleComponentMock }
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
		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();

		if (!environment.production) {
			expect(app.menuItems.some((item) => (typeof item.label === 'function' ? item.label() : item.label) === 'In Development')).toBe(
				true
			);
		}
	}));

	it('should not include "In Development" menu item in production mode', fakeAsync(() => {
		const app = fixture.componentInstance;
		environment.production = true;

		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();

		if (environment.production) {
			expect(app.menuItems.some((item) => (typeof item.label === 'function' ? item.label() : item.label) === 'In Development')).toBe(
				false
			);
		}
	}));

	it('should have correct route for "Home" menu item', fakeAsync(() => {
		const app = fixture.componentInstance;
		app.ngOnInit();
		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		const homeItem = app.menuItems.find((item) => (typeof item.label === 'function' ? item.label() : item.label) === 'Home');
		expect(homeItem?.route).toBe('/');
	}));

	it('should have correct route for "Paint rack" menu item', fakeAsync(() => {
		const app = fixture.componentInstance;
		app.ngOnInit();
		fixture.detectChanges();

		// Use `tick` to simulate the passage of time and completion of async tasks
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		const paintRackItem = app.menuItems.find((item) => (typeof item.label === 'function' ? item.label() : item.label) === 'Paint rack');
		expect(paintRackItem?.route).toBe('/paint-rack');
	}));
});
