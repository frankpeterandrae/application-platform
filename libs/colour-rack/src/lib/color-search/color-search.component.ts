/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { IconDefinition, InputComponent } from '@angular-apps/shared/ui-theme';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { BaseComponent, LOGGER_SOURCE, Scopes } from '@angular-apps/shared-ui';
import { colorRackTextModules } from '../i18n/i18n';
import { provideTranslocoScope, translateSignal } from '@jsverse/transloco';

/**
 * Component for searching colors.
 */
@Component({
	selector: 'cr-color-search',
	templateUrl: './color-search.component.html',
	styleUrls: ['./color-search.component.scss'],
	imports: [InputComponent],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'ColorSearchComponent' }, provideTranslocoScope(Scopes.COLOR_RACK)],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorSearchComponent extends BaseComponent {
	/**
	 * Event emitted when a search is performed.
	 */
	public readonly searchEvent = output<string>();

	public readonly searchColor = translateSignal(colorRackTextModules.ColorSearch.lbl.SearchColor);

	/**
	 * Emits the search event with the current search text.
	 * @param {string} $event - The current search text.
	 */
	public onSearchTermChange($event: string): void {
		if ($event != null) {
			this.searchEvent.emit($event);
		}
	}

	protected readonly IconDefinition = IconDefinition;
}
