/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IconDefinition, InputComponent } from '@application-platform/shared/ui-theme';
import { translateSignal } from '@jsverse/transloco';

import { i18nTextModules } from '../i18n/i18n';

/** Exposes the search text while the parent decides how to present matches. */
@Component({
	selector: 'cr-color-search',
	templateUrl: './color-search.component.html',
	styleUrls: ['./color-search.component.scss'],
	imports: [InputComponent],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorSearchComponent {
	/** Emits the current input, including an empty string when the search is cleared. */
	public readonly searchEvent = output<string>();

	protected readonly searchColor = translateSignal(i18nTextModules.ColorSearch.lbl.SearchColor);

	protected readonly IconDefinition = IconDefinition;

	protected onSearchTermChange(searchTerm: string): void {
		this.searchEvent.emit(searchTerm);
	}
}
