/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { PaintColorGroup } from '@application-platform/paint';
import {
	ButtonColorDefinition,
	ButtonComponent,
	InputComponent,
	PaginationComponent,
	SelectComponent
} from '@application-platform/shared/ui-theme';
import { LOGGER_SOURCE, Scopes, TranslationDirective } from '@application-platform/shared-ui';
import { provideTranslocoScope, translateSignal } from '@jsverse/transloco';
import { catchError, map, of, startWith, Subject, switchMap } from 'rxjs';

import { ColorGridComponent } from '../color-grid/color-grid.component';
import { i18nTextModules } from '../i18n/i18n';
import type { Color, ColorTypeCode, RackColor } from '../models/color.model';
import { ColorService } from '../services/color.service';

type RackState = { status: 'loading' | 'error' } | { status: 'ready'; colors: readonly RackColor[] };

const pageSize = 48;
const rackColumns = 12;

/** Coordinates asset loading, search, sorting and pagination. */
@Component({
	selector: 'cr-color-search-container',
	templateUrl: './color-search-container.component.html',
	styleUrl: './color-search-container.component.scss',
	host: { class: 'fpa-block fpa-min-width-0 fpa-height-100 fpa-overflow-y-auto' },
	imports: [ButtonComponent, ColorGridComponent, FormsModule, InputComponent, PaginationComponent, SelectComponent, TranslationDirective],
	providers: [{ provide: LOGGER_SOURCE, useValue: 'ColorSearchContainerComponent' }, provideTranslocoScope(Scopes.COLOUR_RACK)],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorSearchContainerComponent implements OnInit {
	private readonly meta = inject(Meta);
	private readonly title = inject(Title);
	private readonly colorService = inject(ColorService);
	private readonly reload = new Subject<void>();

	private readonly metaTitle = translateSignal(i18nTextModules.ColorSearchContainer.meta.Title);
	private readonly metaDescription = translateSignal(i18nTextModules.ColorSearchContainer.meta.Description);
	private readonly nameCollator = new Intl.Collator('en', { sensitivity: 'base' });
	private readonly query = signal('');
	protected readonly sort = signal('rack');
	private readonly swatchGroups: Partial<Record<ColorTypeCode, readonly PaintColorGroup[]>> = {
		ME: [PaintColorGroup.Metallic],
		'S-ME': [PaintColorGroup.Metallic],
		'M-ME': [PaintColorGroup.Metallic],
		'H-ME': [PaintColorGroup.Metallic],
		I: [PaintColorGroup.Inks],
		G: [PaintColorGroup.Glaze],
		W: [PaintColorGroup.Washes]
	};

	protected readonly i18nTextModules = i18nTextModules;
	protected readonly ButtonColorDefinition = ButtonColorDefinition;
	protected readonly searchLabel = translateSignal(i18nTextModules.ColorSearch.lbl.SearchColor);
	protected readonly sortLabel = translateSignal(i18nTextModules.ColorSearchContainer.lbl.Sort);
	protected readonly rackOrderLabel = translateSignal(i18nTextModules.ColorSearchContainer.lbl.RackOrder);
	protected readonly nameOrderLabel = translateSignal(i18nTextModules.ColorSearchContainer.lbl.NameOrder);
	protected readonly sortOptions = computed(() => [
		{ value: 'rack', label: this.rackOrderLabel() },
		{ value: 'name', label: this.nameOrderLabel() }
	]);
	protected readonly retryLabel = translateSignal(i18nTextModules.ColorSearchContainer.lbl.Retry);
	protected readonly pageLabel = translateSignal(i18nTextModules.ColorSearchContainer.lbl.Page);
	protected readonly previousLabel = translateSignal(i18nTextModules.ColorSearchContainer.lbl.Previous);
	protected readonly nextLabel = translateSignal(i18nTextModules.ColorSearchContainer.lbl.Next);
	protected readonly page = signal(0);
	protected readonly state = toSignal(
		this.reload.pipe(
			startWith(undefined),
			switchMap(() =>
				this.colorService.getColors().pipe(
					map((colors): RackState => ({ status: 'ready', colors: colors.map((color, index) => this.toRackColor(color, index)) })),
					catchError(() => of<RackState>({ status: 'error' })),
					startWith<RackState>({ status: 'loading' })
				)
			)
		),
		{ requireSync: true }
	);

	private readonly orderedColors = computed(() => {
		const state = this.state();
		if (state.status !== 'ready') return [];

		return this.sort() === 'name'
			? state.colors.slice().sort((left, right) => this.nameCollator.compare(left.name, right.name))
			: state.colors;
	});

	protected readonly matches = computed(() => {
		const query = this.query();
		const colors = this.orderedColors();

		return query ? colors.filter(({ searchTerms }) => searchTerms.some((term) => term.includes(query))) : colors;
	});
	protected readonly pageCount = computed(() => Math.ceil(this.matches().length / pageSize));
	protected readonly visibleColors = computed(() => {
		const offset = this.page() * pageSize;
		return this.matches().slice(offset, offset + pageSize);
	});

	ngOnInit(): void {
		this.title.setTitle(this.metaTitle());
		this.meta.updateTag({ name: 'description', content: this.metaDescription() });
	}

	protected search(query: string): void {
		this.query.set(query.trim().toLowerCase());
		this.page.set(0);
	}

	protected changeSort(sort: string): void {
		this.sort.set(sort);
		this.page.set(0);
	}

	protected changePage(page: number, resultsStatus?: HTMLElement): void {
		this.page.set(page);
		resultsStatus?.focus();
	}

	protected retry(): void {
		this.reload.next();
	}

	private toRackColor(color: Color, index: number): RackColor {
		return {
			...color,
			row: Math.floor(index / rackColumns) + 1,
			column: (index % rackColumns) + 1,
			searchTerms: [color.name, ...color.alternativeNames, color.sku, color.barcode ?? ''].map((term) => term.toLowerCase()),
			paint: {
				id: `two-thin-coats:${color.sku}`,
				brand: 'two-thin-coats',
				sku: color.sku,
				name: color.name,
				category: color.type,
				range: color.wave,
				mainColor: color.mainColor,
				secondaryColor: color.secondaryColor,
				matchColor: color.alternativeNames,
				barcode: color.barcode,
				colorGroups: this.swatchGroups[color.type] ?? []
			}
		};
	}
}
