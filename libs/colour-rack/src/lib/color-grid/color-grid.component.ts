/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { NgStyle } from '@angular/common';
import { AfterViewInit, Component, HostListener, input, OnChanges, OnInit, signal, SimpleChanges, inject, viewChild } from '@angular/core';
import { Color } from '../models/color.model';
import { ColorService } from '../services/color.service';
import { DialogConfigModel, DialogService } from '@angular-apps/shared/ui-theme';
import { ColorDetailsComponent } from '../color-details/color-details.component';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { NumberInput } from '@angular/cdk/coercion';
import { LOGGER_SOURCE, Scopes, TranslationDirective } from '@angular-apps/shared-ui';
import { colorRackTextModules } from '../i18n/i18n';
import { provideTranslocoScope } from '@jsverse/transloco';

/**
 * Component representing a grid of colors.
 */
@Component({
	selector: 'cr-color-grid',
	templateUrl: './color-grid.component.html',
	styleUrls: ['./color-grid.component.scss'],
	imports: [NgStyle, CdkVirtualScrollViewport, CdkVirtualForOf, CdkFixedSizeVirtualScroll, TranslationDirective],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'ColorGridComponent' }, provideTranslocoScope(Scopes.COLOR_RACK)]
})
export class ColorGridComponent implements AfterViewInit, OnInit, OnChanges {
	private readonly colorService = inject(ColorService);
	private readonly dialogService = inject(DialogService);
	public readonly colorRackTextModules = colorRackTextModules;

	public readonly viewPort = viewChild.required(CdkVirtualScrollViewport);
	/**
	 * The search query used to filter and highlight colors.
	 */
	public searchQuery = input<string | undefined>(undefined);

	/**
	 * The list of colors to be displayed in the grid.
	 */
	public colors = signal<Color[][]>([]);
	public itemSize: NumberInput = 68;
	private chunkSize = 12;

	/**
	 * Adjusts the item size, chunk size, and fetches colors when the window is resized.
	 */
	@HostListener('window:resize')
	public adjustOnWindowResize(): void {
		this.updateItemSize();
		this.updateChunkSize();
		this.fetchColors();
	}

	/**
	 * Lifecycle hook that is called after data-bound properties are initialized.
	 */
	ngOnInit(): void {
		this.updateChunkSize();
		this.fetchColors();
	}

	/**
	 * Lifecycle hook that is called when any data-bound property of a directive changes.
	 * @param {SimpleChanges} changes - The changes in the data-bound properties.
	 */
	ngOnChanges(changes: SimpleChanges): void {
		if (changes['searchQuery']) {
			this.highlightMatchingColors(this.searchQuery() || '');
		}
	}

	/**
	 * Lifecycle hook that is called after a component's view has been fully initialized.
	 * This is used to perform any additional initialization tasks that require the view to be fully rendered.
	 */
	public ngAfterViewInit(): void {
		if (this.viewPort()) {
			setTimeout(() => {
				this.updateItemSize();
			});
		}
	}

	/**
	 * Fetches the colors from the ColorService and updates the colors list.
	 */
	private fetchColors(): void {
		this.colorService.getColors().subscribe((colors) => {
			this.calculateStorageLocation(colors);
			const chunkSize = this.chunkSize;
			const colorChunks: Color[][] = [];
			for (let i = 0; i < colors.length; i += chunkSize) {
				colorChunks.push(colors.slice(i, i + chunkSize));
			}
			this.colors.set(colorChunks);

			this.highlightMatchingColors(this.searchQuery() || '');
		});
	}

	/**
	 * Highlights the colors that match the search query.
	 * @param {string} query - The search query to match against color names.
	 */
	public highlightMatchingColors(query: string): void {
		this.colors().forEach((colorRow) => {
			colorRow.forEach((color) => {
				const allNames = [color.name, ...color.alternativeNames];
				color.highlighted = query ? allNames.some((name) => name.toLowerCase().includes(query.toLowerCase())) : false;
			});
		});
	}

	/**
	 * Calculates the storage location of each color based on its index.
	 * @param {Color[]} colors - The array of colors to calculate storage locations for.
	 * @returns {Color[]} - The array of colors with updated storage locations.
	 */
	public calculateStorageLocation(colors: Color[]): Color[] {
		colors.forEach((color, idx) => {
			color.row = Math.floor(idx / 12) + 1;
			color.column = (idx % 12) + 1;
		});
		return colors;
	}

	/**
	 * Opens the details dialog for a given color.
	 * @param {Color} color - The color for which to open the details' dialog.
	 */
	public openDetails(color: Color): void {
		const dialogConfig: DialogConfigModel<Color> = { componentData: color, settings: { title: color.name } };

		this.dialogService.open(ColorDetailsComponent, dialogConfig);
	}

	/**
	 * Updates the item size based on the first color tile's dimensions.
	 */
	private updateItemSize(): void {
		const firstCard: HTMLElement | null = this.viewPort().elementRef.nativeElement.querySelector('.color-tile');
		if (firstCard) {
			const marginTop = parseInt(window.getComputedStyle(firstCard).marginTop, 10);
			const marginBottom = parseInt(window.getComputedStyle(firstCard).marginBottom, 10);
			this.itemSize = firstCard.offsetHeight + marginTop + marginBottom;
		}
		this.updateChunkSize();
	}

	/**
	 * Calculates the chunk size based on the screen width.
	 */
	private updateChunkSize(): void {
		const screenWidth = window.innerWidth / parseFloat(getComputedStyle(document.documentElement).fontSize);
		if (screenWidth <= 40) {
			//40*16 = 640
			this.chunkSize = 2; // xs
		} else if (screenWidth <= 56.25) {
			// 56.25*16 = 900
			this.chunkSize = 3; // sm
		} else if (screenWidth <= 78.125) {
			// 78.125*16 = 1250
			this.chunkSize = 6; // md
		} else if (screenWidth <= 100) {
			// 100*16 = 1600
			this.chunkSize = 6; // lg
		} else {
			this.chunkSize = 12; // xl
		}
	}
}
