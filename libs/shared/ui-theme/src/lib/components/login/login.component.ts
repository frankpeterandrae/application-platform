/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataConnectionService } from '@angular-apps/shared-ui';
import { ButtonComponent } from '../button/button.component';
import { ButtonColorDefinition } from '../../enums';

/**
 * Component for the login form.
 */
@Component({
	selector: 'theme-login',
	imports: [ReactiveFormsModule, ButtonComponent],
	templateUrl: './login.component.html'
})
export class LoginComponent {
	public dataConnection = inject(DataConnectionService);
	private readonly formBuilder = inject(FormBuilder);

	/**
	 * Enum for color definitions.
	 */
	protected readonly ButtonColorDefinition = ButtonColorDefinition;

	/**
	 * Form group for the login form.
	 */
	public loginForm: FormGroup;

	/**
	 * Constructor for LoginComponent.
	 */
	constructor() {
		this.loginForm = this.formBuilder.group({
			email: ['', [Validators.required, Validators.email]],
			password: ['', Validators.required]
		});
	}

	/**
	 * Method to handle login action.
	 */
	public login(): void {
		if (this.loginForm.valid) {
			const { email, password } = this.loginForm.value;
			this.dataConnection.login({ email, password }).subscribe((data) => {
				throw new Error(`Not implemented: ${data}`);
			});
		}
	}
}
