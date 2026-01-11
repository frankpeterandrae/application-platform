/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { Directive, ElementRef, HostListener, inject, input, Renderer2 } from '@angular/core';

/**
 * TooltipDirective is an Angular directive that adds a tooltip to an element.
 * The tooltip appears when the user hovers over the element.
 */
@Directive({
	selector: '[themeTooltip]',
	standalone: true
})
export class TooltipDirective {
	private readonly elementeRef = inject(ElementRef);
	private readonly renderer = inject(Renderer2);

	/**
	 * The text to be displayed inside the tooltip.
	 */
	public themeTooltip = input<string>('');
	private tooltipElement: HTMLElement | null = null;

	/**
	 * Event handler for the mouseenter event.
	 * Creates and displays the tooltip element.
	 */
	@HostListener('mouseenter') public onMouseEnter(): void {
		if (!this.tooltipElement) {
			this.tooltipElement = this.renderer.createElement('span');
			this.renderer.appendChild(this.tooltipElement, this.renderer.createText(this.themeTooltip()));
		}
		this.renderer.appendChild(this.elementeRef.nativeElement, this.tooltipElement);
		this.renderer.addClass(this.tooltipElement, 'fpa-tooltip');

		// Ensure the parent element has relative positioning
		this.renderer.setStyle(this.elementeRef.nativeElement, 'position', 'relative');

		// Set the tooltip position relative to the parent element
		this.renderer.setStyle(this.tooltipElement, 'top', '100%'); // Directly below the element
		this.renderer.setStyle(this.tooltipElement, 'left', '0'); // Align left
	}

	/**
	 * Event handler for the mouseleave event.
	 * Removes the tooltip element from the DOM and sets the reference to null.
	 */
	@HostListener('mouseleave') public onMouseLeave(): void {
		if (this.tooltipElement) {
			this.renderer.removeChild(this.elementeRef.nativeElement, this.tooltipElement);
			this.tooltipElement = null;
		}
	}
}
