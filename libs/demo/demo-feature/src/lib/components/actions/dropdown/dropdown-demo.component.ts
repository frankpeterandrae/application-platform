/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, signal } from '@angular/core';
import { DropdownOption, DropdownSelectComponent, IconDefinition } from '@application-platform/shared/ui-theme';

import { i18nTextModules } from '../../../i18n/i18n';
import { DemoThemeContainerComponent } from '../../demo-theme-container.component';
import { Description } from '../../description';

interface DemoOption {
	id: number;
	name: string;
}

/** Shows object-valued and icon options, including a disabled option. */
@Component({
	selector: 'demo-dropdown-select',
	imports: [DropdownSelectComponent, DemoThemeContainerComponent],
	templateUrl: './dropdown-demo.component.html'
})
export class DropdownDemoComponent {
	protected readonly selectedValue = signal<DemoOption | null>(null);

	protected readonly selectedIcon = signal<string | null>(null);

	protected readonly options = signal<ReadonlyArray<DropdownOption<DemoOption>>>([
		{ value: { id: 1, name: 'Alice' }, label: 'Alice' },
		{ value: { id: 2, name: 'Bob' }, label: 'Bob' },
		{ value: { id: 3, name: 'Charlie' }, label: 'Charlie' },
		{ value: { id: 4, name: 'Diana' }, label: 'Diana', disabled: true }
	]);

	protected readonly iconOptions = signal<ReadonlyArray<DropdownOption<string>>>([
		{ value: 'home', label: 'Home', icon: IconDefinition.HOUSE },
		{ value: 'search', label: 'Search', icon: IconDefinition.SEARCH },
		{ value: 'brush', label: 'Brush', icon: IconDefinition.BRUSH },
		{ value: 'close', label: 'Close', icon: IconDefinition.CLOSE }
	]);

	protected readonly description: Description = {
		title: i18nTextModules.Dropdown.lbl.Title,
		description: i18nTextModules.Dropdown.lbl.Description,
		usage:
			'<theme-dropdown-select\n' +
			'\t[options]="options()"\n' +
			'\t[selected]="selectedValue()"\n' +
			'\t(selectionChange)="selectedValue.set($event)"\n' +
			'\tplaceholder="Choose an option"\n' +
			'></theme-dropdown-select>',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'options', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Dropdown.lbl.OptionsDescription,
							span: 5,
							columntype: 'string',
							type: 'DropdownOption<T>[]'
						}
					]
				},
				{
					columns: [
						{ value: 'selected', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Dropdown.lbl.SelectedDescription,
							span: 5,
							columntype: 'string',
							type: 'T | null'
						}
					]
				},
				{
					columns: [
						{ value: 'placeholder', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Dropdown.lbl.PlaceholderDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'disabled', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.Dropdown.lbl.DisabledDescription,
							span: 5,
							columntype: 'string',
							type: 'boolean'
						}
					]
				},
				{
					columns: [
						{
							value: 'selectionChange',
							span: 1,
							columntype: 'code'
						},
						{
							value: i18nTextModules.Dropdown.lbl.SelectionChangeDescription,
							span: 5,
							columntype: 'string',
							type: 'T'
						}
					]
				}
			]
		}
	};
}
