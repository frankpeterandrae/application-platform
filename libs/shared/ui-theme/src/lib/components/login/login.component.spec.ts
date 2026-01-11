/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';

import { setupTestingModule } from '../../../test-setup';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [LoginComponent]
		});

		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should create the login form with email and password controls', () => {
		expect(component.loginForm.contains('email')).toBeTruthy();
		expect(component.loginForm.contains('password')).toBeTruthy();
	});

	it('should mark email control as invalid if empty', () => {
		const emailControl = component.loginForm.get('email');
		emailControl?.setValue('');
		expect(emailControl?.invalid).toBeTruthy();
	});

	it('should mark email control as invalid if not a valid email', () => {
		const emailControl = component.loginForm.get('email');
		emailControl?.setValue('invalid-email');
		expect(emailControl?.invalid).toBeTruthy();
	});

	it('should mark password control as invalid if empty', () => {
		const passwordControl = component.loginForm.get('password');
		passwordControl?.setValue('');
		expect(passwordControl?.invalid).toBeTruthy();
	});

	it('should call dataConnection.login with form values if form is valid', () => {
		const loginSpy = vi.spyOn(component.dataConnection, 'login').mockReturnValue(EMPTY);
		component.loginForm.setValue({ email: 'test@example.com', password: 'password' });
		component.login();
		expect(loginSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
	});

	it('should not call dataConnection.login if form is invalid', () => {
		const loginSpy = vi.spyOn(component.dataConnection, 'login');
		component.loginForm.setValue({ email: '', password: '' });
		component.login();
		expect(loginSpy).not.toHaveBeenCalled();
	});
});
