/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { LoginComponent } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * LoginDemoComponent demonstrates the usage of the Login component.
 */
@Component({
	selector: 'demo-login',
	imports: [LoginComponent, DemoThemeContainerComponent],
	templateUrl: './login-demo.component.html'
})
export class LoginDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.Login.lbl.Title,
		description: i18nTextModules.Login.lbl.Description,
		usage: '<theme-login></theme-login>',
		language: 'html',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'loginForm', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Login.lbl.FormDescription,
							span: 5,
							columntype: 'string',
							type: 'FormGroup'
						}
					]
				},
				{
					columns: [
						{ value: 'login()', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Login.lbl.LoginMethodDescription,
							span: 5,
							columntype: 'string',
							type: 'void'
						}
					]
				}
			]
		}
	};
}
