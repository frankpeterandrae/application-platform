/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { DropdownOption, DropdownSelectComponent, IconDefinition } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

interface DemoOption {
	id: number;
	name: string;
}

/**
 * DropdownDemoComponent demonstrates the usage of the Dropdown Select component.
 */
@Component({
	selector: 'demo-dropdown-select',
	imports: [DropdownSelectComponent, DemoThemeContainerComponent, CommonModule],
	templateUrl: './dropdown-demo.component.html'
})
export class DropdownDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public readonly selectedValue = signal<DemoOption | null>(null);
	public readonly selectedIcon = signal<string | null>(null);

	public readonly options = signal<ReadonlyArray<DropdownOption<DemoOption>>>([
		{ value: { id: 1, name: 'Alice' }, label: 'Alice' },
		{ value: { id: 2, name: 'Bob' }, label: 'Bob' },
		{ value: { id: 3, name: 'Charlie' }, label: 'Charlie' },
		{ value: { id: 4, name: 'Diana' }, label: 'Diana', disabled: true }
	]);

	public readonly iconOptions = signal<ReadonlyArray<DropdownOption<string>>>([
		{ value: 'home', label: 'Home', icon: IconDefinition.HOUSE },
		{ value: 'search', label: 'Search', icon: IconDefinition.SEARCH },
		{ value: 'brush', label: 'Brush', icon: IconDefinition.BRUSH },
		{ value: 'close', label: 'Close', icon: IconDefinition.CLOSE }
	]);

	public description: Description = {
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
				}
			]
		}
	};
}
