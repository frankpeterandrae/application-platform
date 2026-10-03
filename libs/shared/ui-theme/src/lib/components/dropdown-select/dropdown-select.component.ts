/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	HostListener,
	inject,
	input,
	model,
	output,
	signal,
	viewChild
} from '@angular/core';
import { Logger } from '@application-platform/shared-ui';

import { IconDefinition } from '../../enums';
import { ButtonComponent } from '../button/button.component';

/**
 * Represents an option rendered by DropdownSelectComponent.
 */
export interface DropdownOption<T> {
	value: T;
	label: string;
	icon?: IconDefinition;
	disabled?: boolean;
}

/**
 * Dropdown select with keyboard navigation, optional icons and two-way selection binding.
 */
@Component({
	selector: 'theme-dropdown-select',
	standalone: true,
	imports: [ButtonComponent],
	templateUrl: './dropdown-select.component.html',
	styleUrls: ['./dropdown-select.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownSelectComponent<T> {
	private readonly logger = inject(Logger);
	public readonly options = input.required<ReadonlyArray<DropdownOption<T>>>();

	public readonly placeholder = input<string>('Select');
	public readonly ariaLabel = input<string>();
	public readonly disabled = input<boolean>(false);

	/** Currently selected value. */
	public readonly selected = model<T | null>(null);

	/** Emits explicit selection changes. */
	public readonly selectionChange = output<T | null>();

	protected readonly isOpen = signal(false);

	protected readonly activeIndex = signal<number>(-1);

	protected readonly selectedOption = computed(() => {
		const sel = this.selected();
		if (sel === null) return null;
		return this.options().find((o) => Object.is(o.value, sel)) ?? null;
	});

	protected readonly buttonLabel = computed(() => {
		return this.selectedOption()?.label ?? this.placeholder();
	});

	protected readonly hostEl = viewChild.required<ElementRef<HTMLElement>>('host');

	/**
	 * Toggles the dropdown open or closed state.
	 * When opening, syncs the active index to the current selection and adjusts popup alignment.
	 * Does nothing if the dropdown is disabled.
	 */
	protected toggle(): void {
		if (this.disabled()) return;
		this.isOpen.update((v) => !v);
		if (this.isOpen()) {
			this.syncActiveIndexToSelection();
			this.adjustPopupAlignment();
		}
	}

	/**
	 * Opens the dropdown menu.
	 * Syncs the active index to the current selection and adjusts popup alignment to prevent overflow.
	 * Does nothing if the dropdown is disabled.
	 */
	protected open(): void {
		if (this.disabled()) return;
		this.isOpen.set(true);
		this.syncActiveIndexToSelection();
		this.adjustPopupAlignment();
	}

	/**
	 * Closes the dropdown menu.
	 * Resets the active index to -1 and removes any popup alignment classes.
	 */
	protected close(): void {
		this.isOpen.set(false);
		this.activeIndex.set(-1);
		// remove any alignment class when closed
		this.setPopupAlignRight(false);
		this.setPopupFlipUp(false);

		// Reset inline styles
		const host = this.hostEl().nativeElement;
		const popup = host.querySelector<HTMLElement>('.fpa-dropdown-select-list-container');
		if (popup) {
			popup.style.top = '';
			popup.style.bottom = '';
			popup.style.left = '';
			popup.style.right = '';
		}
	}

	/**
	 * Handle window resize events — recompute popup alignment when open to avoid viewport overflow.
	 */
	@HostListener('window:resize')
	protected onWindowResize(): void {
		if (!this.isOpen()) return;
		this.adjustPopupAlignment();
	}

	/**
	 * Compute whether the popup would overflow to the right and toggle the align-right class.
	 * Also check if it would overflow the bottom and flip it upward if needed.
	 * We allow a small margin (8px) to avoid touching the viewport edge.
	 */
	private adjustPopupAlignment(): void {
		// Wait until the popup has been rendered before measuring its dimensions.
		requestAnimationFrame(() => {
			try {
				const host = this.hostEl().nativeElement;
				const popup = host.querySelector<HTMLElement>('.fpa-dropdown-select-list-container');
				if (!popup) return;

				const popupRect = popup.getBoundingClientRect();
				const popupWidth = popupRect.width || popup.offsetWidth;
				const popupHeight = popupRect.height || popup.offsetHeight;

				const hostRect = host.getBoundingClientRect();

				const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
				const offsetPx = 0.75 * rootFontSize;

				const popupLeft = hostRect.left + offsetPx;

				const margin = 8;

				const willOverflowRight = popupLeft + popupWidth + margin > window.innerWidth;

				this.setPopupAlignRight(willOverflowRight);

				const spaceBelow = window.innerHeight - hostRect.bottom - margin;
				const spaceAbove = hostRect.top - margin;
				const willOverflowBottom = spaceBelow < popupHeight;
				const shouldFlipUp = willOverflowBottom && spaceAbove > spaceBelow;

				this.setPopupFlipUp(shouldFlipUp);

				if (shouldFlipUp) {
					const bottomPos = window.innerHeight - hostRect.top + 8;
					popup.style.bottom = `${bottomPos}px`;
					popup.style.top = 'auto';
				} else {
					const topPos = hostRect.bottom + 8;
					popup.style.top = `${topPos}px`;
					popup.style.bottom = 'auto';
				}

				if (willOverflowRight) {
					popup.style.right = `${window.innerWidth - hostRect.right + offsetPx}px`;
					popup.style.left = 'auto';
				} else {
					popup.style.left = `${popupLeft}px`;
					popup.style.right = 'auto';
				}
			} catch (e) {
				// Log and intentionally ignore measurement errors to avoid breaking dropdown behavior.
				this.logger.warn('DropdownSelectComponent: failed to adjust popup alignment', e);
			}
		});
	}

	private setPopupAlignRight(alignRight: boolean): void {
		const host = this.hostEl().nativeElement;
		const popup = host.querySelector('.fpa-dropdown-select-list-container');
		if (!popup) return;
		if (alignRight) popup.classList.add('align-right');
		else popup.classList.remove('align-right');
	}

	private setPopupFlipUp(flipUp: boolean): void {
		const host = this.hostEl().nativeElement;
		const popup = host.querySelector('.fpa-dropdown-select-list-container');
		if (!popup) return;
		if (flipUp) popup.classList.add('flip-up');
		else popup.classList.remove('flip-up');
	}

	/**
	 * Select the given option.
	 * @param opt The option to select.
	 */
	protected selectOption(opt: DropdownOption<T>): void {
		if (this.disabled() || opt.disabled) return;
		this.selected.set(opt.value);
		this.selectionChange.emit(opt.value);
		this.close();
	}

	private syncActiveIndexToSelection(): void {
		const opts = this.options();
		const sel = this.selected();
		const idx = sel === null ? -1 : opts.findIndex((o) => Object.is(o.value, sel));
		this.activeIndex.set(idx);
	}

	/**
	 * Close the dropdown if a click occurs outside the component.
	 * @param ev The mouse event.
	 */
	@HostListener('document:mousedown', ['$event'])
	protected onDocMouseDown(ev: MouseEvent): void {
		if (!this.isOpen()) return;
		const host = this.hostEl().nativeElement;
		const target = ev.target as Node | null;
		if (target && !host.contains(target)) this.close();
	}

	/**
	 * Handle keyboard events on the main button.
	 * @param ev The keyboard event.
	 */
	protected onButtonKeydown(ev: KeyboardEvent): void {
		if (this.disabled()) return;

		switch (ev.key) {
			case 'Enter':
			case ' ':
				ev.preventDefault();
				this.toggle();
				break;
			case 'ArrowDown':
				ev.preventDefault();
				this.open();
				this.moveActive(+1);
				break;
			case 'ArrowUp':
				ev.preventDefault();
				this.open();
				this.moveActive(-1);
				break;
			case 'Escape':
				ev.preventDefault();
				this.close();
				break;
		}
	}

	/**
	 * Handle keyboard navigation within the options list.
	 * @param ev The keyboard event.
	 */
	protected onListKeydown(ev: KeyboardEvent): void {
		switch (ev.key) {
			case 'ArrowDown':
				ev.preventDefault();
				this.moveActive(+1);
				break;
			case 'ArrowUp':
				ev.preventDefault();
				this.moveActive(-1);
				break;
			case 'Enter':
				ev.preventDefault();
				this.selectActive();
				break;
			case 'Escape':
				ev.preventDefault();
				this.close();
				break;
			case 'Tab':
				this.close();
				break;
		}
	}

	private moveActive(delta: number): void {
		const opts = this.options();
		if (!opts.length) return;

		let i = this.activeIndex();

		if (i < 0) i = delta > 0 ? -1 : opts.length;

		for (const _ of opts) {
			i = (i + delta + opts.length) % opts.length;
			if (!opts[i]?.disabled) {
				this.activeIndex.set(i);
				return;
			}
		}
	}

	private selectActive(): void {
		const idx = this.activeIndex();
		const opts = this.options();
		const opt = opts[idx];
		if (!opt) return;
		this.selectOption(opt);
	}

	/**
	 * Sync change from the native select element (accessibility fallback) into the component model.
	 */
	protected onNativeSelectChange(ev: Event): void {
		const select = ev.target as HTMLSelectElement | null;
		if (!select) return;
		const idx = Number(select.value);
		const opts = this.options();
		if (Number.isNaN(idx) || idx < 0 || idx >= opts.length) return;
		const opt = opts[idx];
		this.selectOption(opt);
	}
}
