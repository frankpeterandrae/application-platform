/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonColorDefinition } from '../../../enums';
import { ButtonComponent } from '../../actions/button/button.component';

/** Renders navigation for a collection with zero-based page indexes. */
@Component({
	selector: 'theme-pagination',
	imports: [ButtonComponent],
	templateUrl: './pagination.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
	public readonly pageIndex = input.required<number>();
	public readonly pageCount = input.required<number>();

	public readonly label = input.required<string>();
	public readonly previousLabel = input.required<string>();
	public readonly nextLabel = input.required<string>();

	public readonly pageChange = output<number>();

	protected readonly buttonColor = ButtonColorDefinition.DEFAULT;
}
