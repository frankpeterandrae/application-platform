/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';
import { LOGGER_SOURCE } from '../../services/logger/logger.service';

import { BaseComponent } from './base.component';

@Component({
	template: ``,
	providers: [{ provide: LOGGER_SOURCE, useValue: 'TestComponent' }]
})
class TestComponent extends BaseComponent {
	public someAction(): void {
		this.logger.info('action');
	}
}

describe('BaseComponent', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let loggerSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TestComponent]
		});

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		loggerSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
		fixture.detectChanges();
	});

	it('should forward calls to the log method of Logger when actions are performed', () => {
		component.someAction();
		expect(loggerSpy).toHaveBeenCalledWith('action');
	});
});
