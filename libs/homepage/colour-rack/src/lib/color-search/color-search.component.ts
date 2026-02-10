/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IconDefinition, InputComponent } from '@application-platform/shared/ui-theme';
import { translateSignal } from '@jsverse/transloco';

import { i18nTextModules } from '../i18n/i18n';

/**
 * Component for searching colors.
 */
@Component({
	selector: 'cr-color-search',
	templateUrl: './color-search.component.html',
	styleUrls: ['./color-search.component.scss'],
	imports: [InputComponent],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorSearchComponent {
	/**
	 * Event emitted when a search is performed.
	 */
	public readonly searchEvent = output<string>();

	public readonly searchColor = translateSignal(i18nTextModules.ColorSearch.lbl.SearchColor);
	/**
	 * Emits the search event with the current search text.
	 * @param {string} $event - The current search text.
	 */
	public onSearchTermChange($event: string): void {
		if ($event) {
			this.searchEvent.emit($event);
		}
	}

	protected readonly IconDefinition = IconDefinition;
}
