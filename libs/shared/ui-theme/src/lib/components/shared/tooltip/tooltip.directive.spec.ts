/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ElementRef, input, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { setupTestingModule } from '../../../../test-setup';

import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
	let directive: TooltipDirective;
	let elementRefMock: ElementRef;
	let rendererMock: Renderer2;

	beforeEach(async () => {
		elementRefMock = { nativeElement: document.createElement('div') } as ElementRef;
		rendererMock = {
			createElement: vi.fn().mockReturnValue(document.createElement('span')),
			createText: vi.fn().mockImplementation((text: string) => document.createTextNode(text)),
			appendChild: vi.fn(),
			addClass: vi.fn(),
			setStyle: vi.fn(),
			removeChild: vi.fn()
		} as unknown as Renderer2;

		await setupTestingModule({
			providers: [
				{ provide: ElementRef, useValue: elementRefMock },
				{ provide: Renderer2, useValue: rendererMock }
			]
		});

		TestBed.runInInjectionContext(() => {
			const themeTooltip = input<string>('Test Tooltip');
			directive = new TooltipDirective();
			directive.themeTooltip = themeTooltip;
		});
	});

	it('should create an instance', () => {
		expect(directive).toBeTruthy();
	});

	it('should create and display the tooltip on mouse enter', () => {
		directive.onMouseEnter();

		expect(rendererMock.createElement).toHaveBeenCalledWith('span');
		expect(rendererMock.createText).toHaveBeenCalledWith('Test Tooltip');
		expect(rendererMock.appendChild).toHaveBeenCalledTimes(2);
		expect(rendererMock.addClass).toHaveBeenCalledWith(expect.any(HTMLElement), 'fpa-tooltip');
		expect(rendererMock.setStyle).toHaveBeenCalledTimes(3);
	});

	it('should remove the tooltip on mouse leave', () => {
		directive.onMouseEnter(); // Add the tooltip first

		directive.onMouseLeave();
		expect(rendererMock.removeChild).toHaveBeenCalledWith(elementRefMock.nativeElement, expect.any(HTMLElement));
		expect(directive['tooltipElement']).toBeNull();
	});
});
