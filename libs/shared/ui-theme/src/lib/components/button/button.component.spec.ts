/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
		fixture.detectChanges();

		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
		expect(buttonElement.classList).toContain('fpa-success');
	});

	it('should emit onClick event when button is clicked', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		const onClickSpy = vi.spyOn(component.buttonClick, 'emit');
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

	it('should add "fpa-flex-row-reverse" class when iconEnd is true', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.componentRef.setInput('iconEnd', true);
		fixture.detectChanges();

		const contentDiv = fixture.nativeElement.querySelector('button .fpa-flex');
		expect(contentDiv.classList).toContain('fpa-flex-row-reverse');
	});

	it('should disable the button and apply the disabled class', () => {
		fixture.componentRef.setInput('disabled', true);
		fixture.detectChanges();

		const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

		expect(button.classList).toContain('fpa-disabled');
		expect(button.disabled).toBe(true);
	});

	it('should not add "fpa-disabled" class when disabled is false', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.componentRef.setInput('disabled', false);
		fixture.detectChanges();

		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');
		expect(buttonElement.classList).not.toContain('fpa-disabled');
		expect(buttonElement.disabled).toBe(false);
	});

	it('should update the color class when the color input changes', () => {
		fixture.componentRef.setInput('color', ButtonColorDefinition.PRIMARY);
		fixture.detectChanges();

		const buttonElement: HTMLButtonElement = fixture.nativeElement.querySelector('button');

		expect(buttonElement.classList).toContain('fpa-primary');

		fixture.componentRef.setInput('color', ButtonColorDefinition.SUCCESS);
		fixture.detectChanges();

		expect(buttonElement.classList).not.toContain('fpa-primary');
		expect(buttonElement.classList).toContain('fpa-success');
	});

	it('should update the icon position when iconEnd changes', () => {
		fixture.componentRef.setInput('iconEnd', false);
		fixture.detectChanges();

		const contentDiv = fixture.nativeElement.querySelector('button .fpa-flex');

		expect(contentDiv.classList).not.toContain('fpa-flex-row-reverse');

		fixture.componentRef.setInput('iconEnd', true);
		fixture.detectChanges();

		expect(contentDiv.classList).toContain('fpa-flex-row-reverse');
	});

	it('should not emit buttonClick when disabled', () => {
		fixture.componentRef.setInput('disabled', true);

		const emitSpy = vi.spyOn(component.buttonClick, 'emit');

		fixture.detectChanges();

		component.handleClick();

		expect(emitSpy).not.toHaveBeenCalled();
	});

	it('should forward button type and aria attributes', () => {
		fixture.componentRef.setInput('type', 'submit');
		fixture.componentRef.setInput('ariaExpanded', true);
		fixture.componentRef.setInput('ariaHaspopup', 'menu');

		fixture.detectChanges();

		const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

		expect(button.type).toBe('submit');
		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(button.getAttribute('aria-haspopup')).toBe('menu');
	});

	it('should emit keydown events', () => {
		const emitSpy = vi.spyOn(component.keydownEvent, 'emit');
		const event = new KeyboardEvent('keydown', { key: 'Enter' });

		const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

		button.dispatchEvent(event);

		expect(emitSpy).toHaveBeenCalledWith(event);
	});
});
