/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use async factory and vi.importActual so the mock works in Vitest ESM environment
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

import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoScope, TRANSLOCO_SCOPE } from '@jsverse/transloco';

import { setupTestingModule } from '../../../test-setup';

import { TranslationDirective } from './translation.directive';

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

	it('should create directive', () => {
		expect(debugEl).toBeTruthy();
		const directive = debugEl.injector.get(TranslationDirective);
		expect(directive).toBeTruthy();
	});

	it('should have required inputs', () => {
		const directive = debugEl.injector.get(TranslationDirective);
		expect(directive).toBeTruthy();
	});

	it('should accept optional scope input', () => {
		const directive = debugEl.injector.get(TranslationDirective);
		expect(typeof directive.fpaSharedUiTranslateScope).toBe('function');
	});

	it('should not throw when initialized', () => {
		expect(() => {
			fixture.detectChanges();
		}).not.toThrow();
	});

	it('should be applied as a directive', () => {
		const directiveElement = debugEl.nativeElement;
		expect(directiveElement).toBeTruthy();
	});
});
