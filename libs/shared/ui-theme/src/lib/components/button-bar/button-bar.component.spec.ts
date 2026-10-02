/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { setupTestingModule } from '../../../test-setup';
import { ButtonColorDefinition } from '../../enums';
import { ButtonComponent } from '../button/button.component';

import { ButtonBarComponent } from './button-bar.component';

describe('ButtonBarComponent', () => {
	let fixture: ComponentFixture<ButtonBarComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ButtonBarComponent]
		});

		fixture = TestBed.createComponent(ButtonBarComponent);
	});

	it('should render two configured buttons', () => {
		const callbacks = [vi.fn(), vi.fn()];

		fixture.componentRef.setInput('buttons', [
			{
				buttonText: 'Save',
				callback: callbacks[0],
				color: ButtonColorDefinition.PRIMARY
			},
			{
				buttonText: 'Delete',
				callback: callbacks[1],
				color: ButtonColorDefinition.DANGER
			}
		]);

		fixture.detectChanges();

		const buttons = fixture.nativeElement.querySelectorAll('theme-button');

		expect(buttons).toHaveLength(2);
	});

	it('should invoke the configured callback when a button is clicked', () => {
		const callback = vi.fn();

		fixture.componentRef.setInput('buttons', [
			{
				buttonText: 'Save',
				callback,
				color: ButtonColorDefinition.PRIMARY
			}
		]);

		fixture.detectChanges();

		const button = fixture.debugElement.query(By.directive(ButtonComponent));

		button.componentInstance.buttonClick.emit();

		expect(callback).toHaveBeenCalledOnce();
	});
});
