/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { ButtonComponent, DialogComponent, DialogService, DialogType } from '@application-platform/shared/ui-theme';

import { i18nTextModules } from '../../../i18n/i18n';
import { DemoThemeContainerComponent } from '../../demo-theme-container.component';
import { Description } from '../../description';

/** Shows how a demo action opens an informational dialog. */
@Component({
	selector: 'demo-dialog',
	imports: [ButtonComponent, DemoThemeContainerComponent],
	templateUrl: './dialog-demo.component.html'
})
export class DialogDemoComponent {
	private readonly dialogService = inject(DialogService);

	protected readonly description: Description = {
		title: i18nTextModules.Dialog.lbl.Title,
		description: i18nTextModules.Dialog.lbl.Description,
		usage:
			'this.dialogService.open(DialogComponent, {\n' +
			'\tcomponentData: undefined,\n' +
			'\tsettings: {\n' +
			"\t\ttitle: 'Dialog Title',\n" +
			'\t\ttype: DialogType.INFO\n' +
			'\t}\n' +
			'});',
		language: 'javascript',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'DialogService.open()', span: 1, columntype: 'code' },
						{ value: i18nTextModules.Dialog.lbl.OpenDescription, span: 5, columntype: 'string', type: 'void' }
					]
				}
			]
		}
	};

	protected openBasicDialog(): void {
		this.dialogService.open(DialogComponent, {
			componentData: undefined,
			settings: {
				title: 'Basic Dialog',
				type: DialogType.INFO
			}
		});
	}
}
