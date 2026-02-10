/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { JsonPipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardComponent, TextareaComponent } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * TextareaDemoComponent demonstrates the usage of the Textarea component.
 */
@Component({
	selector: 'demo-textarea',
	imports: [TextareaComponent, DemoThemeContainerComponent, ReactiveFormsModule, CardComponent, JsonPipe],
	templateUrl: './textarea-demo.component.html'
})
export class TextareaDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public demoForm = new FormGroup({
		comment: new FormControl('', [Validators.required, Validators.minLength(10)]),
		description: new FormControl(''),
		disabledTextarea: new FormControl({ value: 'This textarea is disabled', disabled: true })
	});

	public description: Description = {
		title: i18nTextModules.Textarea.lbl.Title,
		description: i18nTextModules.Textarea.lbl.Description,
		usage:
			'<theme-textarea\n' +
			'\t[label]="\'Comments\'"\n' +
			'\t[placeholder]="\'Enter your comments...\'"\n' +
			'\t[formControl]="commentControl"\n' +
			'></theme-textarea>',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'label', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Textarea.lbl.LabelDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'placeholder', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Textarea.lbl.PlaceholderDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'isDynamic', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Textarea.lbl.IsDynamicDescription,
							span: 5,
							columntype: 'string',
							type: 'boolean'
						}
					]
				}
			]
		}
	};
}
