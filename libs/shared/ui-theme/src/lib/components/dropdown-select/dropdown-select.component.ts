/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
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
import { Logger } from '@application-platform/services';

import { IconDefinition } from '../../enums';
import { ButtonComponent } from '../button/button.component';

export interface DropdownOption<T> {
	value: T;
	label: string;
	icon?: IconDefinition;
	disabled?: boolean;
}

/**
 *
 */
@Component({
	selector: 'theme-dropdown-select',
	standalone: true,
	imports: [CommonModule, ButtonComponent],
	templateUrl: './dropdown-select.component.html',
	styleUrls: ['./dropdown-select.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownSelectComponent<T> {
	private readonly logger = inject(Logger);
	/// required, so the component is truly "data-driven"
	public readonly options = input.required<ReadonlyArray<DropdownOption<T>>>();

	public readonly placeholder = input<string>('Select');
	public readonly disabled = input<boolean>(false);

	/**
	 * Two-way binding: [(selected)]="signalOrField"
	 * You can also set only [selected] and listen to (selectedChange).
	 */
	public readonly selected = model<T | null>(null);

	/**
	 * Optional, if you prefer to react explicitly to selection changes.
	 */
	public readonly selectionChange = output<T | null>();

	public readonly isOpen = signal(false);

	public readonly activeIndex = signal<number>(-1);

	public readonly selectedOption = computed(() => {
		const sel = this.selected();
		if (sel === null) return null;
		return this.options().find((o) => Object.is(o.value, sel)) ?? null;
	});

	public readonly buttonLabel = computed(() => {
		return this.selectedOption()?.label ?? this.placeholder();
	});

	public readonly hostEl = viewChild.required<ElementRef<HTMLElement>>('host');

	/**
	 *
	 */
	public toggle(): void {
		if (this.disabled()) return;
		this.isOpen.update((v) => !v);
		if (this.isOpen()) {
			this.syncActiveIndexToSelection();
			this.adjustPopupAlignment();
		}
	}

	/**
	 *
	 */
	public open(): void {
		if (this.disabled()) return;
		this.isOpen.set(true);
		this.syncActiveIndexToSelection();
		this.adjustPopupAlignment();
	}

	/**
	 *
	 */
	public close(): void {
		this.isOpen.set(false);
		this.activeIndex.set(-1);
		// remove any alignment class when closed
		this.setPopupAlignRight(false);
	}

	/**
	 * Handle window resize events — recompute popup alignment when open to avoid viewport overflow.
	 */
	@HostListener('window:resize')
	public onWindowResize(): void {
		if (!this.isOpen()) return;
		this.adjustPopupAlignment();
	}

	/**
	 * Compute whether the popup would overflow to the right and toggle the align-right class.
	 * We allow a small margin (8px) to avoid touching the viewport edge.
	 */
	private adjustPopupAlignment(): void {
		// wait a frame so the popup DOM is present and measured correctly
		requestAnimationFrame(() => {
			try {
				const host = this.hostEl().nativeElement as HTMLElement;
				const popup = host.querySelector('.fpa-dropdown-select-list-container') as HTMLElement | null;
				if (!popup) return;

				// Measure popup width
				const popupRect = popup.getBoundingClientRect();
				const popupWidth = popupRect.width || popup.offsetWidth;

				// Measure host position relative to viewport
				const hostRect = host.getBoundingClientRect();

				// calculate the left offset where popup would be placed (0.75rem in CSS)
				// Convert rem to px using root font-size
				const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize || '16');
				const leftOffsetPx = 0.75 * rootFontSize;

				// absolute position of popup's left edge if placed normally
				const popupLeft = hostRect.left + leftOffsetPx;

				// small safety margin from viewport edge
				const margin = 8;

				const willOverflowRight = popupLeft + popupWidth + margin > window.innerWidth;

				this.setPopupAlignRight(willOverflowRight);
			} catch (e) {
				// Log and intentionally ignore measurement errors to avoid breaking dropdown behavior.
				this.logger.warn('DropdownSelectComponent: failed to adjust popup alignment', e);
			}
		});
	}

	private setPopupAlignRight(alignRight: boolean): void {
		const host = this.hostEl().nativeElement as HTMLElement;
		const popup = host.querySelector('.fpa-dropdown-select-list-container') as HTMLElement | null;
		if (!popup) return;
		if (alignRight) popup.classList.add('align-right');
		else popup.classList.remove('align-right');
	}

	/**
	 *
	 */
	public selectOption(opt: DropdownOption<T>): void {
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
	 *
	 */
	@HostListener('document:mousedown', ['$event'])
	public onDocMouseDown(ev: MouseEvent): void {
		if (!this.isOpen()) return;
		const host = this.hostEl().nativeElement;
		const target = ev.target as Node | null;
		if (target && !host.contains(target)) this.close();
	}

	/**
	 *
	 */
	public onButtonKeydown(ev: KeyboardEvent): void {
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
	 *
	 */
	public onListKeydown(ev: KeyboardEvent): void {
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
				// Tab soll normal weitergehen, Dropdown aber schließen
				this.close();
				break;
		}
	}

	private moveActive(delta: number): void {
		const opts = this.options();
		if (!opts.length) return;

		let i = this.activeIndex();
		// start sinnvoll setzen
		if (i < 0) i = delta > 0 ? -1 : opts.length;

		// nächstes nicht-disabled finden
		for (let steps = 0; steps < opts.length; steps++) {
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
	public onNativeSelectChange(ev: Event): void {
		const select = ev.target as HTMLSelectElement | null;
		if (!select) return;
		const idx = Number(select.value);
		const opts = this.options();
		if (Number.isNaN(idx) || idx < 0 || idx >= opts.length) return;
		const opt = opts[idx];
		this.selectOption(opt);
	}
}
