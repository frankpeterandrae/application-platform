/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../../test-setup';

import { NotificationComponent } from './notification.component';

describe('NotificationComponent', () => {
	beforeEach(async () => {
		await setupTestingModule({ imports: [NotificationComponent] });
	});

	it.each([
		['info', 1200, 'status', '1200ms'],
		['info', null, 'status', ''],
		['error', 1200, 'alert', '']
	] as const)('renders a %s notification with duration %s', (tone, duration, role, delay) => {
		const fixture = TestBed.createComponent(NotificationComponent);
		fixture.componentRef.setInput('message', 'Export message');
		fixture.componentRef.setInput('tone', tone);
		fixture.componentRef.setInput('durationMs', duration);
		fixture.detectChanges();

		const element = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`[role="${role}"]`);
		expect(element?.textContent).toContain('Export message');
		expect(element?.style.animationDelay).toBe(delay);
		expect(element?.classList.contains('fpa-notification--temporary')).toBe(delay !== '');
	});
});
