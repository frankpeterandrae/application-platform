/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { OverlayConfig } from '@angular/cdk/overlay';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import type { ComponentType } from '@angular/cdk/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { inject, Injectable, Injector } from '@angular/core';
import { tap } from 'rxjs/operators';

import type { DialogConfigModel } from '../../model/dialog-config.model';

import { DIALOG_DATA } from './dialog-tokens';

/**
 * Service to manage dialog operations.
 */
@Injectable({
	providedIn: 'root'
})
export class DialogService {
	private readonly overlay = inject(Overlay);
	private readonly injector = inject(Injector);

	/**
	 * Opens a dialog with the specified component and data.
	 * @param component - The component to be displayed in the dialog.
	 * @param data - The configuration data for the dialog.
	 * @returns {OverlayRef} The reference to the created overlay.
	 */
	public open<C = unknown, T = unknown>(component: ComponentType<C>, data: DialogConfigModel<T>): OverlayRef {
		const config: OverlayConfig = {
			hasBackdrop: true,
			backdropClass: 'dark-backdrop',
			panelClass: 'dialog-panel',
			positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
			maxWidth: '90vw'
		};
		const overlayRef = this.overlay.create(config);

		const customInjector = Injector.create({
			providers: [
				{ provide: DIALOG_DATA, useValue: data },
				{ provide: OverlayRef, useValue: overlayRef }
			],
			parent: this.injector
		});

		const componentPortal = new ComponentPortal(component, null, customInjector);
		overlayRef.attach(componentPortal);

		// The following intentionally calls a void-returning dispose() inside the
		// observable pipeline; silence the confusing-void-expression rule for this
		// line because we explicitly want the side-effect and do not need the
		// Subscription object.

		overlayRef
			.backdropClick()
			.pipe(
				tap(() => {
					overlayRef.dispose();
				})
			)
			.subscribe();

		return overlayRef;
	}
}
