/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, inject } from '@angular/core';
import { ButtonComponent, DialogComponent, DialogService } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * DialogDemoComponent demonstrates the usage of the Dialog component.
 */
@Component({
	selector: 'demo-dialog',
	imports: [ButtonComponent, DemoThemeContainerComponent],
	templateUrl: './dialog-demo.component.html'
})
export class DialogDemoComponent {
	private readonly dialogService = inject(DialogService);
	public readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.Dialog.lbl.Title,
		description: i18nTextModules.Dialog.lbl.Description,
		usage:
			'this.dialogService.open(DialogComponent, {\n' +
			'\tcomponentData: undefined,\n' +
			'\tsettings: {\n' +
			"\t\ttitle: 'Dialog Title'\n" +
			'\t}\n' +
			'});',
		language: 'javascript',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'DialogService.open()', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Dialog.lbl.OpenDescription,
							span: 5,
							columntype: 'string',
							type: 'void'
						}
					]
				}
			]
		}
	};

	/**
	 * Opens a basic dialog.
	 */
	public openBasicDialog(): void {
		this.dialogService.open(DialogComponent, {
			componentData: undefined,
			settings: {
				title: 'Basic Dialog'
			}
		});
	}

	/**
	 * Opens a dialog with content.
	 */
	public openDialogWithContent(): void {
		this.dialogService.open(DialogComponent, {
			componentData: undefined,
			settings: {
				title: 'Dialog with Content'
			}
		});
	}
}
