/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { APP_ENVIRONMENT } from '@application-platform/shared-ui';

import { setupTestingModule } from '../../../test-setup';

import { LoginDemoComponent } from './login-demo.component';

describe('LoginDemoComponent', () => {
	let component: LoginDemoComponent;
	let fixture: ComponentFixture<LoginDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [LoginDemoComponent],
			providers: [
				{
					provide: APP_ENVIRONMENT,
					useValue: {
						production: false,
						baseUrl: 'http://localhost'
					}
				}
			]
		});

		fixture = TestBed.createComponent(LoginDemoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
