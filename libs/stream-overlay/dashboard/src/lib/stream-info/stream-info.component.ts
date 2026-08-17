/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonColorDefinition, ButtonComponent, InputComponent } from '@application-platform/shared/ui-theme';
import { StreamStateService } from '@application-platform/stream-overlay-data-access';

import { DashboardContainerComponent } from '../dashboard-container/dashboard-container.component';

/**
 * Allows editing transient stream information.
 */
@Component({
	selector: 'stream-dashboard-stream-info',
	standalone: true,
	imports: [ReactiveFormsModule, InputComponent, ButtonComponent, DashboardContainerComponent],
	templateUrl: './stream-info.component.html',
	styleUrl: './stream-info.component.scss'
})
export class StreamInfoComponent {
	private readonly streamStateService = inject(StreamStateService);

	protected readonly form = new FormGroup({
		title: new FormControl<string>(''),
		subtitle: new FormControl<string>('')
	});

	constructor() {
		effect(() => {
			this.form.setValue(
				{
					title: this.streamStateService.title() ?? '',
					subtitle: this.streamStateService.subtitle() ?? ''
				},
				{
					emitEvent: false
				}
			);
		});
	}

	/**
	 * Applies the current form values to the stream state.
	 */
	protected apply(): void {
		const { title, subtitle } = this.form.getRawValue();

		this.streamStateService.updateState({
			title: title || undefined,
			subtitle: subtitle || undefined
		});
	}

	protected readonly ButtonColorDefinition = ButtonColorDefinition;
}
