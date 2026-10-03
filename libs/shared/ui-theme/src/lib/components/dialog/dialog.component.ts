/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { OverlayRef } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';

import { ButtonColorDefinition, IconDefinition } from '../../enums';
import type { DialogConfigModel } from '../../model/';
import { ButtonComponent } from '../button/button.component';

import { DIALOG_DATA } from './dialog-tokens';

/**
 * Renders a dialog inside an Angular CDK overlay.
 */
@Component({
	selector: 'theme-dialog',
	imports: [ButtonComponent],
	templateUrl: './dialog.component.html',
	styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {
	private readonly overlayRef = inject(OverlayRef);
	public readonly data = inject<DialogConfigModel<unknown>>(DIALOG_DATA);

	protected accept(): void {
		this.data.settings?.onAccept?.();
		this.overlayRef.dispose();
	}

	protected decline(): void {
		this.data.settings?.onDecline?.();
		this.overlayRef.dispose();
	}

	protected close(): void {
		this.overlayRef.dispose();
	}

	protected readonly ButtonColorDefinition = ButtonColorDefinition;
	protected readonly IconDefinition = IconDefinition;
}
