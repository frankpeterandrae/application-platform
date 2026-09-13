/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import { ButtonColorDefinition, IconDefinition } from '../../enums';

/**
 * ButtonComponent is a reusable button component with customizable properties.
 */
@Component({
	selector: 'theme-button',
	imports: [CommonModule, FastSvgComponent],
	templateUrl: './button.component.html',
	styleUrls: ['./button.base.scss', './button.variants.scss']
})
export class ButtonComponent {
	/** Event emitter for button click events. */
	public buttonClick = output();

	/** Text to be displayed on the button. */
	public buttonText = input<string>();

	/** Icon to be displayed on the button. */
	public icon = input<IconDefinition>();

	/** Color definition for the button. */
	public color = input<ButtonColorDefinition>();

	/** Flag to determine if the icon should be displayed at the end. */
	public iconEnd = input<boolean>(false);

	/** Flag to disable the button. */
	public disabled = input<boolean>(false);

	/** Type of the button (submit, reset, button). */
	public type = input<'submit' | 'reset' | 'button'>('button');

	/** Optional ARIA attributes forwarded to the inner button. */
	public ariaExpanded = input<boolean | undefined>();
	public ariaHaspopup = input<string | undefined>();

	/** Expose keydown events from the inner button. */
	public keydownEvent = output<KeyboardEvent>();

	/** CSS classes for the button element. */
	public buttonClasses: string[] = [];

	/** CSS classes for the content inside the button. */
	public contentClasses: string[] = [];

	/**
	 * Callback function to emit the click event.
	 */
	public callback(): void {
		if (!this.disabled()) {
			this.buttonClick.emit();
		}
	}
}
