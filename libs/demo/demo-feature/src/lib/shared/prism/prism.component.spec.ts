/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { PrismComponent } from './prism.component';

describe('PrismComponent', () => {
	let fixture: ComponentFixture<PrismComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [PrismComponent]
		});

		fixture = TestBed.createComponent(PrismComponent);
	});

	it('should render the provided code', () => {
		fixture.componentRef.setInput('code', '<button>Test</button>');
		fixture.detectChanges();

		const code = fixture.nativeElement.querySelector('code') as HTMLElement;

		expect(code.textContent).toContain('<button>Test</button>');
	});

	it('re-highlights the rendered code when its inputs change', () => {
		fixture.detectChanges();
		fixture.componentRef.setInput('language', 'javascript');
		fixture.componentRef.setInput('code', 'const value = 1;');
		fixture.detectChanges();

		const code = fixture.nativeElement.querySelector('code') as HTMLElement;

		expect(code.classList).toContain('language-javascript');
		expect(code.querySelector('.token.keyword')?.textContent).toBe('const');
	});
});
