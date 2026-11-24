/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonColorDefinition, ButtonComponent, InputComponent } from '@application-platform/shared/ui-theme';
import { finalize } from 'rxjs';

import { DashboardContainerComponent } from '../dashboard-container/dashboard-container.component';

/** Lets an authorized operator configure the Twitch app and user grant. */
@Component({
	selector: 'stream-dashboard-config',
	imports: [ReactiveFormsModule, DashboardContainerComponent, InputComponent, ButtonComponent],
	templateUrl: './config.component.html',
	styleUrl: './config.component.scss'
})
export class ConfigComponent {
	private readonly http = inject(HttpClient);
	private readonly document = inject(DOCUMENT);
	private readonly destroyRef = inject(DestroyRef);
	protected readonly ButtonColorDefinition = ButtonColorDefinition;
	protected readonly saving = signal(false);
	protected readonly needsConfigKey = signal(false);
	protected readonly redirectUri = signal('');
	protected readonly message = signal(this.authorizationResult(inject(ActivatedRoute).snapshot.queryParamMap.get('twitch') ?? ''));
	protected readonly configKey = new FormControl('', { nonNullable: true });
	protected readonly appForm = new FormGroup({
		clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
		clientSecret: new FormControl('', { nonNullable: true, validators: [Validators.required] })
	});
	protected readonly grantForm = new FormGroup({
		refreshToken: new FormControl('', { nonNullable: true, validators: [Validators.required] })
	});
	protected readonly permissions = new FormGroup({
		chatRead: new FormControl(true, { nonNullable: true }),
		chatWrite: new FormControl(false, { nonNullable: true }),
		alerts: new FormControl(false, { nonNullable: true })
	});

	constructor() {
		afterNextRender(() => {
			const location = this.document.location;
			if (location.protocol === 'http:' && location.hostname === '127.0.0.1') {
				const dashboard = new URL(location.href);
				dashboard.hostname = 'localhost';
				location.replace(dashboard.href);
				return;
			}
			this.http
				.get<{ redirectUri: string }>('/api/twitch/config/redirect-uri')
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe({
					next: ({ redirectUri }) => this.redirectUri.set(redirectUri),
					error: () => this.redirectUri.set('')
				});
		});
	}

	/** Starts the Twitch consent flow with the selected permissions. */
	protected connect(): void {
		if (this.saving()) {
			return;
		}
		const permissions = this.permissions.getRawValue();
		if (!permissions.chatRead && !permissions.chatWrite && !permissions.alerts) {
			this.message.set('Wähle mindestens eine Berechtigung aus.');
			return;
		}

		this.saving.set(true);
		this.permissions.disable();
		this.message.set('Twitch wird geöffnet …');
		this.http
			.post<{ url: string }>('/api/twitch/config/authorize', permissions, { headers: this.authorizationHeaders() })
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => {
					this.permissions.enable();
					this.saving.set(false);
				})
			)
			.subscribe({
				next: ({ url }) => this.document.location.assign(url),
				error: (error: HttpErrorResponse) => {
					this.message.set(
						error.status === 400
							? 'Öffne das Dashboard mit demselben Hostnamen und Protokoll wie die Twitch-Weiterleitungs-URL.'
							: this.errorMessage(error.status, false)
					);
				}
			});
	}

	/** Stores the app credentials for the next server start. */
	protected saveApp(): void {
		const { clientId, clientSecret } = this.appForm.getRawValue();
		if (clientId.trim() && clientSecret.trim()) {
			this.save('app', { clientId: clientId.trim(), clientSecret: clientSecret.trim() });
		}
	}

	/** Sends the new refresh token to the stream overlay server. */
	protected saveGrant(): void {
		const { refreshToken } = this.grantForm.getRawValue();
		if (refreshToken.trim()) {
			this.save('grant', { refreshToken: refreshToken.trim() });
		}
	}

	private save(kind: 'app' | 'grant', credentials: Record<string, string>): void {
		if (this.saving()) {
			return;
		}

		const isApp = kind === 'app';
		const form = isApp ? this.appForm : this.grantForm;
		this.saving.set(true);
		this.message.set(isApp ? 'Twitch-App wird gespeichert …' : 'Twitch-Zugang wird geprüft …');
		form.disable();
		this.http
			.put<void>(isApp ? '/api/twitch/config/app' : '/api/twitch/config', credentials, {
				headers: this.authorizationHeaders()
			})
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => {
					form.enable();
					this.saving.set(false);
				})
			)
			.subscribe({
				next: () => {
					form.reset();
					this.message.set(
						isApp
							? 'Twitch-App gespeichert. Starte den Overlay-Server neu, um die Zugangsdaten zu übernehmen.'
							: 'Twitch-Zugang geprüft und gespeichert.'
					);
				},
				error: (error: HttpErrorResponse) => this.message.set(this.errorMessage(error.status, isApp))
			});
	}

	private authorizationHeaders(): Record<string, string> {
		const key = this.configKey.getRawValue().trim();
		return key ? { Authorization: `Bearer ${key}` } : {};
	}

	private errorMessage(status: number, isApp: boolean): string {
		switch (status) {
			case 400:
				return isApp
					? 'Gib die Client-ID und das Client Secret ein.'
					: 'Twitch hat den Refresh-Token abgelehnt. Prüfe, ob er zur konfigurierten Twitch-App gehört und noch gültig ist.';
			case 401:
				this.needsConfigKey.set(true);
				return this.configKey.getRawValue().trim()
					? 'Der Konfigurationsschlüssel ist ungültig.'
					: 'Für diesen Zugriff ist ein Konfigurationsschlüssel erforderlich.';
			case 503:
				return 'Speichere zuerst die Twitch-App und starte den Overlay-Server neu.';
			default:
				return isApp
					? 'Die Twitch-App konnte nicht gespeichert werden.'
					: 'Der Twitch-Zugang konnte nicht geprüft oder gespeichert werden.';
		}
	}

	private authorizationResult(result: string): string {
		switch (result) {
			case 'connected':
				return 'Twitch-Konto verbunden. Der Server hat die Tokens gespeichert.';
			case 'denied':
				return 'Die Twitch-Autorisierung wurde abgebrochen.';
			case 'expired':
				return 'Die Twitch-Autorisierung ist abgelaufen. Starte sie erneut.';
			case 'failed':
				return 'Twitch-Konto konnte nicht verbunden werden. Prüfe die App-Zugangsdaten und die registrierte Weiterleitungs-URL.';
			default:
				return '';
		}
	}
}
