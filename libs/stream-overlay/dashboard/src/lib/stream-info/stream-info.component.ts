/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonColorDefinition, ButtonComponent, InputComponent } from '@application-platform/shared/ui-theme';
import { StreamStateService } from '@application-platform/stream-overlay-data-access';
import { finalize } from 'rxjs';

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
	private readonly http = inject(HttpClient);
	private readonly destroyRef = inject(DestroyRef);
	private readonly streamStateService = inject(StreamStateService);

	protected readonly ButtonColorDefinition = ButtonColorDefinition;
	protected readonly loadingTitle = signal(false);
	protected readonly titleStatus = signal('');
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

	/** Reads the connected Twitch channel's title into the editable form. */
	protected loadTwitchTitle(): void {
		if (this.loadingTitle()) {
			return;
		}
		const title = this.form.controls.title;
		const previousTitle = title.value;
		this.loadingTitle.set(true);
		this.titleStatus.set('Twitch-Titel wird geladen …');
		this.http
			.get<{ title: string }>('/api/twitch/stream-title')
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.loadingTitle.set(false))
			)
			.subscribe({
				next: (result) => {
					if (title.value !== previousTitle) {
						this.titleStatus.set('Der Titel wurde inzwischen bearbeitet. Lade den Twitch-Titel bei Bedarf erneut.');
						return;
					}
					title.setValue(result.title);
					this.titleStatus.set('Twitch-Titel geladen.');
				},
				error: (error: HttpErrorResponse) => this.titleStatus.set(this.titleError(error.status))
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

	private titleError(status: number): string {
		switch (status) {
			case 404:
				return 'Twitch meldet keinen Titel für den verbundenen Kanal.';
			case 429:
				return 'Twitch meldet ein Anfragelimit. Versuche es später erneut.';
			case 503:
				return 'Die Twitch-Verbindung ist nicht verfügbar. Prüfe sie unter Konfiguration.';
			default:
				return 'Der Twitch-Titel konnte nicht geladen werden.';
		}
	}
}
