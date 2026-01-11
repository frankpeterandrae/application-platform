/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';
import { ButtonColorDefinition } from '../../enums';

import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
	let component: ButtonComponent;
	let fixture: ComponentFixture<ButtonComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ButtonComponent]
		});

		fixture = TestBed.createComponent(ButtonComponent);
		component = fixture.componentInstance;
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should render the button with default settings', () => {
		fixture.componentRef.setInput('buttonText', 'Click Me');
		fixture.componentRef.setInput('color', ButtonColorDefinition.PRIMARY);
		fixture.detectChanges();
		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
		expect(buttonElement).toBeTruthy();
		expect(buttonElement.textContent).toContain('Click Me');
	});

	it('should apply correct classes based on color input', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		component.ngOnInit(); // Call ngOnInit to initialize classes
		fixture.detectChanges();

		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
		expect(buttonElement.classList).toContain('fpa-success'); // Ensure class matches format
	});

	it('should emit onClick event when button is clicked', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		const onClickSpy = jest.spyOn(component.buttonClick, 'emit');
		fixture.detectChanges();

		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
		buttonElement.click();

		expect(onClickSpy).toHaveBeenCalled();
	});

	it('should render icon if icon input is provided', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.componentRef.setInput('icon', 'test-icon');
		fixture.detectChanges();

		const iconElement = fixture.nativeElement.querySelector('fast-svg');
		expect(iconElement).toBeTruthy();
	});

	it('should render button text when buttonText input is provided', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.componentRef.setInput('buttonText', 'Test Button');
		fixture.detectChanges();

		const spanElement = fixture.nativeElement.querySelector('button span');
		expect(spanElement).toBeTruthy();
		expect(spanElement.textContent).toContain('Test Button');
	});

	it('should add "fpa-df-direction-row-reverse" class when iconEnd is true', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.componentRef.setInput('iconEnd', true);
		component.ngOnInit(); // Apply classes
		fixture.detectChanges();

		const contentDiv = fixture.nativeElement.querySelector('button .fpa-flex');
		expect(contentDiv.classList).toContain('fpa-flex-row-reverse');
	});

	it('should add "fpa-disabled" class when disabled is true', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.componentRef.setInput('disabled', true);
		component.ngOnInit();
		fixture.detectChanges();

		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		expect(buttonElement.classList).toContain('fpa-disabled');
	});

	it('should not add "fpa-disabled" class when disabled is false', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.componentRef.setInput('disabled', false);
		component.ngOnInit();
		fixture.detectChanges();

		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
		expect(buttonElement.classList).not.toContain('fpa-disabled');
	});
});
