/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { setupTestingModule } from '../../test-setup';

import { ConfigComponent } from './config.component';

describe('ConfigComponent', () => {
	let fixture: ComponentFixture<ConfigComponent>;
	let element: HTMLElement;
	let http: HttpTestingController;
	const redirectUri = 'http://localhost:3000/api/twitch/config/callback';

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ConfigComponent],
			providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
		});
		fixture = TestBed.createComponent(ConfigComponent);
		fixture.detectChanges();
		element = fixture.nativeElement as HTMLElement;
		http = TestBed.inject(HttpTestingController);
		http.expectOne('/api/twitch/config/redirect-uri').flush({ redirectUri });
		fixture.detectChanges();
	});

	afterEach(() => http.verify());

	it('tries OAuth without a browser key and offers manual authorization on HTTP 401', () => {
		const button = element.querySelector<HTMLButtonElement>('fieldset button')!;
		expect(element.textContent).toContain(redirectUri);

		expect(button.disabled).toBe(false);
		expect(element.querySelector('input#twitch-config-key')).toBeNull();
		button.click();
		const automaticRequest = http.expectOne({ method: 'POST', url: '/api/twitch/config/authorize' });
		expect(automaticRequest.request.headers.has('Authorization')).toBe(false);
		automaticRequest.flush(null, { status: 401, statusText: 'Unauthorized' });
		fixture.detectChanges();
		expect(element.querySelector('output')?.textContent).toContain('Konfigurationsschlüssel erforderlich');

		const keyInput = element.querySelector<HTMLInputElement>('input#twitch-config-key')!;
		keyInput.value = 'operator-key';
		keyInput.dispatchEvent(new Event('input', { bubbles: true }));
		button.click();
		const request = http.expectOne({ method: 'POST', url: '/api/twitch/config/authorize' });
		expect(request.request.headers.get('Authorization')).toBe('Bearer operator-key');
		request.flush(null, { status: 401, statusText: 'Unauthorized' });
	});

	it('requires a permission before contacting Twitch', () => {
		element.querySelector<HTMLInputElement>('fieldset input[type="checkbox"]')!.click();
		element.querySelector<HTMLButtonElement>('fieldset button')!.click();
		fixture.detectChanges();
		http.expectNone('/api/twitch/config/authorize');
		expect(element.querySelector('output')?.textContent).toContain('mindestens eine Berechtigung');
	});

	it('saves trimmed app credentials and clears the fields on success', () => {
		const id = element.querySelector<HTMLInputElement>('input#twitch-client-id')!;
		const secret = element.querySelector<HTMLInputElement>('input#twitch-client-secret')!;
		setInput(id, ' client ');
		setInput(secret, ' secret ');
		fixture.detectChanges();
		element.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();
		const request = http.expectOne({ method: 'PUT', url: '/api/twitch/config/app' });
		expect(request.request.body).toEqual({ clientId: 'client', clientSecret: 'secret' });
		request.flush(null);
		fixture.detectChanges();
		expect(id.value).toBe('');
		expect(secret.value).toBe('');
		expect(element.querySelector('output')?.textContent).toContain('Overlay-Server neu');
	});

	it('preserves a rejected refresh token and clears it after a successful retry', () => {
		const refreshToken = element.querySelector<HTMLInputElement>('input#twitch-refresh-token')!;
		const button = element.querySelector<HTMLButtonElement>('details button')!;
		setInput(refreshToken, ' token ');
		fixture.detectChanges();
		button.click();
		const request = http.expectOne({ method: 'PUT', url: '/api/twitch/config' });
		expect(request.request.body).toEqual({ refreshToken: 'token' });
		request.flush(null, { status: 400, statusText: 'Bad Request' });
		fixture.detectChanges();
		expect(refreshToken.value).toBe(' token ');
		expect(element.querySelector('output')?.textContent).toContain('Refresh-Token abgelehnt');

		button.click();
		http.expectOne({ method: 'PUT', url: '/api/twitch/config' }).flush(null);
		fixture.detectChanges();
		expect(refreshToken.value).toBe('');
		expect(element.querySelector('output')?.textContent).toContain('geprüft und gespeichert');
	});
});

/** Updates an input through its native input event. */
function setInput(input: HTMLInputElement, value: string): void {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}
