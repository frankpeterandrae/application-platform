jest.mock('@jsverse/transloco', () => {
	const original = jest.requireActual('@jsverse/transloco');
	return {
		...original,
		translateSignal: jest.fn((key: any, params?: any, options?: any) => {
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
import { TranslationDirective } from './translation.directive';
import { TranslocoScope, TRANSLOCO_SCOPE } from '@jsverse/transloco';

@Component({
	imports: [TranslationDirective],
	template: `<span [fpaSharedUiTranslate]="key" [fpaSharedUiTranslateParams]="params" [fpaSharedUiTranslateScope]="scope"></span>`
})
class TestHostComponent {
	public key = 'greeting';
	public params = { name: 'John' };
	public scope?: string | string[] | TranslocoScope;
}

describe('TranslationDirective', () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let debugEl: DebugElement;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{
					provide: TRANSLOCO_SCOPE,
					useValue: { scope: 'default' }
				}
			]
		});
		fixture = TestBed.createComponent(TestHostComponent);
		debugEl = fixture.debugElement.query(By.directive(TranslationDirective));
		// no manual override needed—translateSignal is already mocked above
	});

	it('renders translated text with default scope', () => {
		fixture.detectChanges();
		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_default');
	});

	it('updates translation when parameters change', () => {
		fixture.detectChanges();
		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_default');
		fixture.componentInstance.params = { name: 'Jane' };
		fixture.detectChanges();
		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"Jane"}_default');
	});

	it('uses provided string scope when specified', () => {
		fixture.componentInstance.scope = 'custom';
		fixture.detectChanges();
		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_custom');
	});

	it('uses first element of scope array when specified', () => {
		fixture.componentInstance.scope = ['arrScope', 'other'];
		fixture.detectChanges();
		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_arrScope');
	});

	it('uses TranslocoScope object when specified', () => {
		fixture.componentInstance.scope = { scope: 'objScope' };
		fixture.detectChanges();
		expect(debugEl.nativeElement.textContent).toBe('greeting{"name":"John"}_objScope');
	});
});
