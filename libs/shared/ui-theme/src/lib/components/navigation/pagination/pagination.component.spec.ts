/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
	it('hides single-page navigation and emits only available page indexes', async () => {
		await setupTestingModule({ imports: [PaginationComponent] });
		const fixture = TestBed.createComponent(PaginationComponent);
		const root = fixture.nativeElement as HTMLElement;
		const pageChange = vi.fn();
		fixture.componentInstance.pageChange.subscribe(pageChange);
		fixture.componentRef.setInput('label', 'Pages');
		fixture.componentRef.setInput('previousLabel', 'Previous');
		fixture.componentRef.setInput('nextLabel', 'Next');
		fixture.componentRef.setInput('pageIndex', 0);
		fixture.componentRef.setInput('pageCount', 1);
		fixture.detectChanges();

		expect(root.querySelector('nav')).toBeNull();

		fixture.componentRef.setInput('pageCount', 2);
		fixture.detectChanges();
		const [previous, next] = root.querySelectorAll<HTMLButtonElement>('button');
		expect(previous.disabled).toBe(true);
		expect(next.classList.contains('fpa-default')).toBe(true);
		previous.click();
		next.click();
		expect(pageChange.mock.calls).toEqual([[1]]);

		fixture.componentRef.setInput('pageIndex', 1);
		fixture.detectChanges();
		expect(next.disabled).toBe(true);
		next.click();
		previous.click();
		expect(pageChange.mock.calls).toEqual([[1], [0]]);
	});
});
