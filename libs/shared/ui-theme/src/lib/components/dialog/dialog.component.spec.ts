/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { OverlayRef } from '@angular/cdk/overlay';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';
import type { DialogConfigModel } from '../../model/dialog-config.model';
import { ButtonComponent } from '../button/button.component';

import { DIALOG_DATA } from './dialog-tokens';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
	let fixture: ComponentFixture<DialogComponent>;
	let dispose: ReturnType<typeof vi.fn>;
	let onAccept: ReturnType<typeof vi.fn>;
	let onDecline: ReturnType<typeof vi.fn>;

	const getButtons = (): ButtonComponent[] =>
		fixture.debugElement.queryAll(By.directive(ButtonComponent)).map((element) => element.componentInstance as ButtonComponent);

	beforeEach(async () => {
		dispose = vi.fn();
		onAccept = vi.fn();
		onDecline = vi.fn();

		const data: DialogConfigModel<unknown> = {
			componentData: undefined,
			settings: {
				title: 'Test Dialog',
				content: 'Dialog content',
				onAccept,
				onDecline
			}
		};

		await setupTestingModule({
			imports: [DialogComponent],
			providers: [
				{
					provide: OverlayRef,
					useValue: { dispose }
				},
				{
					provide: DIALOG_DATA,
					useValue: data
				}
			]
		});

		fixture = TestBed.createComponent(DialogComponent);
		fixture.detectChanges();
	});

	it('should render the dialog title and content', () => {
		const title = fixture.nativeElement.querySelector('h2');
		const content = fixture.nativeElement.querySelector('.dialog-content');

		expect(title.textContent?.trim()).toBe('Test Dialog');
		expect(content.textContent?.trim()).toBe('Dialog content');
	});

	it('should render a semantic dialog associated with its title', () => {
		const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

		expect(dialog).not.toBeNull();
		expect(dialog.getAttribute('aria-labelledby')).toBe('dialog-title');

		const title = fixture.nativeElement.querySelector('#dialog-title');

		expect(title).not.toBeNull();
	});

	it('should render the default action labels', () => {
		const [, declineButton, acceptButton] = getButtons();

		expect(declineButton.buttonText()).toBe('Abbrechen');
		expect(acceptButton.buttonText()).toBe('Bestätigen');
	});

	it('should close the dialog from the close button', () => {
		const [closeButton] = getButtons();

		closeButton.buttonClick.emit();

		expect(dispose).toHaveBeenCalledOnce();
	});

	it('should close the dialog when the backdrop is clicked', () => {
		const backdrop = fixture.nativeElement.querySelector('.fpa-back-drop') as HTMLElement;

		backdrop.click();

		expect(dispose).toHaveBeenCalledOnce();
	});

	it('should accept the dialog and close it', () => {
		const [, , acceptButton] = getButtons();

		acceptButton.buttonClick.emit();

		expect(onAccept).toHaveBeenCalledOnce();
		expect(onDecline).not.toHaveBeenCalled();
		expect(dispose).toHaveBeenCalledOnce();
	});

	it('should decline the dialog and close it', () => {
		const [, declineButton] = getButtons();

		declineButton.buttonClick.emit();

		expect(onDecline).toHaveBeenCalledOnce();
		expect(onAccept).not.toHaveBeenCalled();
		expect(dispose).toHaveBeenCalledOnce();
	});
});
