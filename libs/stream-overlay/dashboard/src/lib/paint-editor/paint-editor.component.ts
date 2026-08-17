/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Paint, PaintBrandDefinition, PaintColorGroup, paintColorGroups, PaintId } from '@application-platform/paint';
import { PaintApiService } from '@application-platform/paint-data-access/client';
import {
	ButtonColorDefinition,
	ButtonComponent,
	DialogComponent,
	DialogService,
	IconDefinition,
	InputComponent,
	SelectComponent
} from '@application-platform/shared/ui-theme';
import { PaintSwatchComponent } from '@application-platform/shared-ui';
import { FastSvgComponent } from '@push-based/ngx-fast-svg';

import { DashboardContainerComponent } from '../dashboard-container/dashboard-container.component';

type ColorGroupFilter = PaintColorGroup | 'unassigned' | undefined;
type SaveStatus = 'idle' | 'success' | 'error' | 'deleted';

/**
 * Provides the editor for creating, updating and deleting paints.
 *
 * The component loads the available paint brands and paints from PaintApiService,
 * manages the paint form and provides filtering by brand, color group and search
 * term.
 */
@Component({
	selector: 'stream-dashboard-paint-editor',
	imports: [
		FastSvgComponent,
		FormsModule,
		ReactiveFormsModule,
		ButtonComponent,
		InputComponent,
		DashboardContainerComponent,
		SelectComponent,
		PaintSwatchComponent
	],
	templateUrl: './paint-editor.component.html',
	styleUrl: './paint-editor.component.scss'
})
export class PaintEditorComponent {
	protected readonly ButtonColorDefinition = ButtonColorDefinition;
	private readonly paintApiService = inject(PaintApiService);
	private readonly formBuilder = inject(FormBuilder);
	private readonly dialogService = inject(DialogService);

	protected readonly paints = signal<Paint[]>([]);

	protected readonly brands = signal<PaintBrandDefinition[]>([]);

	protected readonly selectedPaint = signal<Paint | undefined>(undefined);

	protected readonly searchTerm = signal('');

	protected readonly selectedBrand = signal<string | undefined>(undefined);
	protected readonly selectedColorGroup = signal<ColorGroupFilter>(undefined);

	protected readonly isNew = computed(() => this.selectedPaint() === undefined);

	protected readonly saveStatus = signal<SaveStatus>('idle');
	protected readonly filteredPaints = computed(() => {
		const search = this.searchTerm().trim().toLowerCase();

		const brand = this.selectedBrand();

		const colorGroup = this.selectedColorGroup();

		return this.paints().filter((paint) => {
			const matchesBrand = !brand || paint.brand === brand;

			const matchesSearch = !search || paint.name.toLowerCase().includes(search) || paint.sku.toLowerCase().includes(search);

			const matchesColorGroup =
				!colorGroup || (colorGroup === 'unassigned' ? paint.colorGroups.length === 0 : paint.colorGroups.includes(colorGroup));

			return matchesBrand && matchesSearch && matchesColorGroup;
		});
	});

	protected readonly brandOptions = computed(() =>
		this.brands().map(({ id, label }) => ({
			value: id,
			label
		}))
	);

	protected readonly colorGroupFilterOptions = [
		{
			value: 'unassigned' as const,
			label: 'Ohne Zuordnung'
		},
		...paintColorGroups.map(({ id, label }) => ({
			value: id,
			label
		}))
	];

	protected readonly paintForm = this.formBuilder.nonNullable.group({
		brand: ['', Validators.required],
		sku: ['', Validators.required],
		name: ['', Validators.required],
		range: [''],
		category: [''],
		mainColor: ['#000000', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
		secondaryColor: ['', Validators.pattern(/^$|^#[0-9a-fA-F]{6}$/)],
		barcode: [''],
		colorGroups: this.formBuilder.nonNullable.control<PaintColorGroup[]>([], Validators.required)
	});

	constructor() {
		this.loadData();
	}

	/**
	 * Resets the editor for creating a new paint.
	 */
	protected createPaint(): void {
		this.selectedPaint.set(undefined);

		this.paintForm.reset({
			brand: '',
			sku: '',
			name: '',
			range: '',
			category: '',
			mainColor: '#000000',
			secondaryColor: '',
			barcode: '',
			colorGroups: []
		});

		this.paintForm.controls.brand.enable();
		this.paintForm.controls.sku.enable();
	}

	/**
	 * Loads an existing paint into the editor.
	 *
	 * @param paint The paint to edit.
	 */
	protected editPaint(paint: Paint): void {
		this.selectedPaint.set(paint);

		this.paintForm.reset({
			brand: paint.brand,
			sku: paint.sku,
			name: paint.name,
			range: paint.range ?? '',
			category: paint.category ?? '',
			mainColor: paint.mainColor,
			secondaryColor: paint.secondaryColor ?? '',
			barcode: paint.barcode ?? '',
			colorGroups: [...paint.colorGroups]
		});

		/*
		 * The brand and SKU together form the ID.
		 * Therefore, do not change them when editing.
		 */
		this.paintForm.controls.brand.disable();
		this.paintForm.controls.sku.disable();
	}

	/**
	 * Creates or updates the paint represented by the current form.
	 */
	protected save(): void {
		if (this.paintForm.invalid) {
			this.paintForm.markAllAsTouched();
			return;
		}

		const value = this.paintForm.getRawValue();

		const selectedPaint = this.selectedPaint();

		if (selectedPaint) {
			const paint = this.createPaintFromForm(selectedPaint.id);

			this.paintApiService.updatePaint(paint).subscribe({
				next: () => {
					this.loadPaints();
					this.selectedPaint.set(paint);
					this.showSaveStatus('success');
				},
				error: () => {
					this.showSaveStatus('error');
				}
			});

			return;
		}

		const id = `${value.brand}:${value.sku}` as PaintId;

		const paint = this.createPaintFromForm(id);

		this.paintApiService.createPaint(paint).subscribe({
			next: () => {
				this.loadPaints();
				this.editPaint(paint);
				this.showSaveStatus('success');
			},
			error: () => {
				this.showSaveStatus('error');
			}
		});
	}

	/**
	 * Deletes the currently selected paint.
	 */
	protected deletePaint(): void {
		const paint = this.selectedPaint();

		if (!paint) {
			return;
		}

		this.dialogService.open(DialogComponent, {
			componentData: paint,
			settings: {
				title: 'Farbe löschen',
				content: `Soll "${paint.name}" wirklich gelöscht werden?`,
				acceptText: 'Löschen',
				declineText: 'Abbrechen',
				onAccept: () => this.confirmDeletePaint(paint)
			}
		});
	}

	private confirmDeletePaint(paint: Paint): void {
		this.paintApiService.deletePaint(paint.id).subscribe({
			next: () => {
				this.createPaint();
				this.loadPaints();
				this.showSaveStatus('deleted');
			},
			error: () => {
				this.showSaveStatus('error');
			}
		});
	}

	private createPaintFromForm(id: PaintId): Paint {
		const value = this.paintForm.getRawValue();

		return {
			id,
			brand: value.brand as string,
			sku: value.sku,
			name: value.name,
			mainColor: value.mainColor as `#${string}`,
			...(value.range && {
				range: value.range
			}),
			...(value.category && {
				category: value.category
			}),
			...(value.secondaryColor && {
				secondaryColor: value.secondaryColor as `#${string}`
			}),
			...(value.barcode && {
				barcode: value.barcode
			}),
			colorGroups: value.colorGroups
		};
	}

	private loadData(): void {
		this.paintApiService.getBrands().subscribe((brands) => this.brands.set(brands));

		this.loadPaints();
	}
	private loadPaints(): void {
		this.paintApiService.getPaints().subscribe((paints) => {
			paints.sort((a, b) => a.sku.localeCompare(b.sku));
			return this.paints.set(paints);
		});
	}

	private showSaveStatus(status: Exclude<SaveStatus, 'idle'>): void {
		this.saveStatus.set(status);

		setTimeout(() => {
			this.saveStatus.set('idle');
		}, 3000);
	}

	protected readonly IconDefinition = IconDefinition;
	protected readonly paintColorGroups = paintColorGroups;
}
