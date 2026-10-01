/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TRANSLOCO_SCOPE, TranslocoScope } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { TranslationDirective } from './translation.directive';

vi.mock('@jsverse/transloco', async () => {
	const original = await vi.importActual('@jsverse/transloco');

	return {
		...original,
		translateSignal: vi.fn((key: any, params?: any, options?: any) => {
			return (): string => {
				const k = typeof key === 'function' ? key() : key;
				const p = typeof params === 'function' ? params() : params;
				const sc = options?.scope;

				return `${k}${JSON.stringify(p)}${sc ? `_${sc}` : ''}`;
			};
		})
	};
});

@Component({
	imports: [TranslationDirective],
	template: `<span [fpaSharedUiTranslate]="key" [fpaSharedUiTranslateParams]="params" [fpaSharedUiTranslateScope]="scope">suffix</span>`
})
class TestHostComponent {
	public key = 'greeting';
	public params = { name: 'John' };
	public scope?: string | string[] | TranslocoScope;
}

describe('TranslationDirective', () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let component: TestHostComponent;
	let debugEl: DebugElement;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TestHostComponent, TranslationDirective],
			providers: [
				{
					provide: TRANSLOCO_SCOPE,
					useValue: { scope: 'default' }
				}
			]
		});
		fixture = TestBed.createComponent(TestHostComponent);
		component = fixture.componentInstance;
		debugEl = fixture.debugElement.query(By.directive(TranslationDirective));
	});

	it('should render the translated value and preserve the existing suffix', () => {
		fixture.detectChanges();

		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_defaultsuffix');
	});

	it('should use the provided scope', () => {
		component.scope = 'custom';

		fixture.detectChanges();

		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_customsuffix');
	});

	it('should use the first scope when an array is provided', () => {
		component.scope = ['first', 'second'];

		fixture.detectChanges();

		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_firstsuffix');
	});
});
