/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { NumberInput } from '@angular/cdk/coercion';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { NgStyle } from '@angular/common';
import {
	type AfterViewInit,
	type OnInit,
	Component,
	computed,
	DestroyRef,
	HostListener,
	inject,
	input,
	signal,
	viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type DialogConfigModel, DialogService, DialogType } from '@application-platform/shared/ui-theme';
import { LOGGER_SOURCE, Scopes, TranslationDirective } from '@application-platform/shared-ui';
import { provideTranslocoScope } from '@jsverse/transloco';

import { ColorDetailsComponent } from '../color-details/color-details.component';
import { i18nTextModules } from '../i18n/i18n';
import type { Color } from '../models/color.model';
import { ColorService } from '../services/color.service';

/** Displays the physical paint rack in virtual rows that adapt to the viewport. */
@Component({
	selector: 'cr-color-grid',
	templateUrl: './color-grid.component.html',
	styleUrls: ['./color-grid.component.scss'],
	imports: [NgStyle, CdkVirtualScrollViewport, CdkVirtualForOf, CdkFixedSizeVirtualScroll, TranslationDirective],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'ColorGridComponent' }, provideTranslocoScope(Scopes.COLOUR_RACK)]
})
export class ColorGridComponent implements AfterViewInit, OnInit {
	private readonly colorService = inject(ColorService);
	private readonly dialogService = inject(DialogService);
	protected readonly i18nTextModules = i18nTextModules;

	private readonly destroyRef = inject(DestroyRef);
	private readonly viewPort = viewChild.required(CdkVirtualScrollViewport);
	private readonly allColors = signal<Color[]>([]);
	private readonly chunkSize = signal(12);

	/** Dims non-matching tiles without changing their order or storage position. */
	public readonly searchQuery = input<string>();

	protected itemSize: NumberInput = 68;
	protected readonly colors = computed(() => {
		const colors = this.allColors();
		const chunkSize = this.chunkSize();
		const chunks: Color[][] = [];
		for (let index = 0; index < colors.length; index += chunkSize) {
			chunks.push(colors.slice(index, index + chunkSize));
		}
		return chunks;
	});

	protected readonly matchingColors = computed(() => {
		const query = this.searchQuery()?.toLowerCase();
		return query
			? new Set(
					this.allColors().filter(({ name, alternativeNames }) =>
						[name, ...alternativeNames].some((candidate) => candidate.toLowerCase().includes(query))
					)
				)
			: undefined;
	});

	@HostListener('window:resize')
	protected adjustOnWindowResize(): void {
		this.updateItemSize();
		this.updateChunkSize();
	}

	ngOnInit(): void {
		this.updateChunkSize();
		this.colorService
			.getColors()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((colors) => {
				// The physical rack always has twelve columns. The viewport can wrap tiles at narrower widths.
				this.allColors.set(
					colors.map((color, index) => ({
						...color,
						row: Math.floor(index / 12) + 1,
						column: (index % 12) + 1
					}))
				);
			});
	}

	ngAfterViewInit(): void {
		// Measure after the virtual viewport has laid out its initial row.
		const timer = setTimeout(() => this.updateItemSize());
		this.destroyRef.onDestroy(() => clearTimeout(timer));
	}

	protected openDetails(color: Color): void {
		const dialogConfig: DialogConfigModel<Color> = { componentData: color, settings: { title: color.name, type: DialogType.INFO } };
		this.dialogService.open(ColorDetailsComponent, dialogConfig);
	}

	private updateItemSize(): void {
		const firstCard: HTMLElement | null = this.viewPort().elementRef.nativeElement.querySelector('.color-tile');
		if (firstCard) {
			const { marginTop, marginBottom } = getComputedStyle(firstCard);
			const rowHeight = firstCard.offsetHeight + (Number.parseFloat(marginTop) || 0) + (Number.parseFloat(marginBottom) || 0);
			if (rowHeight > 0) {
				this.itemSize = rowHeight;
			}
		}
	}

	private updateChunkSize(): void {
		// Match the theme grid breakpoints, which are expressed in rem.
		const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
		const screenWidth = window.innerWidth / rootFontSize;
		if (screenWidth <= 40) {
			this.chunkSize.set(2);
		} else if (screenWidth <= 56.25) {
			this.chunkSize.set(3);
		} else if (screenWidth <= 100) {
			this.chunkSize.set(6);
		} else {
			this.chunkSize.set(12);
		}
	}

	protected backgroundColor(color: Color): string {
		if (color.secondaryColor) {
			switch (color.type) {
				case 'ME':
				case 'S-ME':
				case 'M-ME':
				case 'H-ME':
					return `linear-gradient(-45deg, ${color.secondaryColor}, ${color.mainColor}, ${color.secondaryColor})`;
				case 'I':
				case 'G':
					return `linear-gradient(0deg,${color.secondaryColor},${color.mainColor})`;
				case 'W':
					return `radial-gradient(circle,${color.mainColor}, ${color.secondaryColor})`;
				case 'M':
				case 'S':
				case 'H':
				case 'E':
				case 'B':
				case 'DA':
					return color.mainColor;
			}
		}
		return color.mainColor;
	}
}
