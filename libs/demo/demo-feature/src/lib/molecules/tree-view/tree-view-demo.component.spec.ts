/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { TreeViewDemoComponent } from './tree-view-demo.component';

describe('TreeViewDemoComponent', () => {
	let component: TreeViewDemoComponent;
	let fixture: ComponentFixture<TreeViewDemoComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TreeViewDemoComponent]
		});

		fixture = TestBed.createComponent(TreeViewDemoComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('component initialization', () => {
		it('should have description with title', () => {
			expect(component.description.title).toBeDefined();
			expect(component.description.title).toBe(component.i18nTextModules.TreeView.lbl.Title);
		});

		it('should have description with translation key', () => {
			expect(component.description.description).toBe(component.i18nTextModules.TreeView.lbl.Description);
		});

		it('should have usage example in description', () => {
			expect(component.description.usage).toBeDefined();
			expect(component.description.usage).toContain('theme-tree-view');
		});

		it('should specify typescript as language for usage examples', () => {
			expect(component.description.language).toBe('typescript');
		});

		it('should have definition table with properties', () => {
			expect(component.description.definition).toBeDefined();
			expect(component.description.definition?.rows).toBeDefined();
			expect(component.description.definition?.rows.length).toBeGreaterThan(0);
		});

		it('should have empty selected item content on initialization', () => {
			expect(component.selectedItemContent()).toBeUndefined();
		});

		it('should initialize with tree items', () => {
			expect(component.items).toBeDefined();
			expect(Array.isArray(component.items)).toBe(true);
			expect(component.items.length).toBeGreaterThan(0);
		});
	});

	describe('tree items structure', () => {
		it('should have first item as a leaf', () => {
			const firstItem = component.items[0];
			expect(firstItem.type).toBe('leaf');
			expect(firstItem.label).toBe('Leaf 1');
		});

		it('should have leaf item with numeric content', () => {
			const leafItem = component.items[0];
			expect(leafItem.type).toBe('leaf');
			expect((leafItem as any).content).toBe(42);
		});

		it('should have second item as a folder', () => {
			const secondItem = component.items[1];
			expect(secondItem.type).toBe('folder');
			expect(secondItem.label).toBe('Folder 1');
		});

		it('should have folder with children', () => {
			const folderItem = component.items[1];
			expect(folderItem.type).toBe('folder');
			expect((folderItem as any).children).toBeDefined();
			expect((folderItem as any).children.length).toBeGreaterThan(0);
		});

		it('should have folder initially collapsed', () => {
			const folderItem = component.items[1];
			expect((folderItem as any).expanded).toBe(false);
		});

		it('should have nested folder with string content leaf', () => {
			const folderItem = component.items[1];
			const children = (folderItem as any).children;
			const nestedFolder = children[0];
			const nestedLeaf = nestedFolder.children[0];
			expect(nestedLeaf.type).toBe('leaf');
			expect(nestedLeaf.content).toBe('Hello, World!');
		});

		it('should have nested leaf with object content', () => {
			const folderItem = component.items[1];
			const children = (folderItem as any).children;
			const objectLeaf = children[1];
			expect(objectLeaf.type).toBe('leaf');
			expect(objectLeaf.content).toEqual({ message: 'This is a leaf content' });
		});
	});

	describe('item selection', () => {
		it('should update signal when leaf item is selected', () => {
			const leafItem = component.items[0];
			const expectedContent = (leafItem as any).content;

			component.selectedItem(expectedContent);

			expect(component.selectedItemContent()).toBe(expectedContent);
		});

		it('should update signal with numeric content', () => {
			const numericContent = 42;
			component.selectedItem(numericContent);

			expect(component.selectedItemContent()).toBe(numericContent);
		});

		it('should update signal with string content', () => {
			const stringContent = 'Hello, World!';
			component.selectedItem(stringContent);

			expect(component.selectedItemContent()).toBe(stringContent);
		});

		it('should update signal with object content', () => {
			const objectContent = { message: 'This is a leaf content' };
			component.selectedItem(objectContent);

			expect(component.selectedItemContent()).toEqual(objectContent);
		});

		it('should allow replacing previous selection with new selection', () => {
			component.selectedItem(42);
			expect(component.selectedItemContent()).toBe(42);

			component.selectedItem('Hello, World!');
			expect(component.selectedItemContent()).toBe('Hello, World!');
		});

		it('should handle null content selection', () => {
			component.selectedItem(null);
			expect(component.selectedItemContent()).toBe(null);
		});

		it('should handle undefined content selection', () => {
			component.selectedItem(undefined);
			expect(component.selectedItemContent()).toBeUndefined();
		});
	});

	describe('definition table content', () => {
		it('should have items property documented', () => {
			const itemsRow = component.description.definition?.rows.find((row) => row.columns.some((col) => col.value === 'items'));
			expect(itemsRow).toBeDefined();
		});

		it('should have selectedItem property documented', () => {
			const selectedItemRow = component.description.definition?.rows.find((row) =>
				row.columns.some((col) => col.value === 'selectedItem')
			);
			expect(selectedItemRow).toBeDefined();
		});

		it('should have LeafItem type documented', () => {
			const leafItemRow = component.description.definition?.rows.find((row) =>
				row.columns.some((col) => col.value === 'LeafItem<T>')
			);
			expect(leafItemRow).toBeDefined();
		});

		it('should have FolderItem type documented', () => {
			const folderItemRow = component.description.definition?.rows.find((row) =>
				row.columns.some((col) => col.value === 'FolderItem')
			);
			expect(folderItemRow).toBeDefined();
		});

		it('should have expanded property documented', () => {
			const expandedRow = component.description.definition?.rows.find((row) => row.columns.some((col) => col.value === 'expanded'));
			expect(expandedRow).toBeDefined();
		});

		it('should have content property documented', () => {
			const contentRow = component.description.definition?.rows.find((row) => row.columns.some((col) => col.value === 'content'));
			expect(contentRow).toBeDefined();
		});

		it('should mark expanded as optional', () => {
			const expandedRow = component.description.definition?.rows.find((row) => row.columns.some((col) => col.value === 'expanded'));
			const expandedColumn = expandedRow?.columns.find((col) => col.value === 'expanded');
			expect(expandedColumn?.optional).toBe(true);
		});

		it('should mark content as optional', () => {
			const contentRow = component.description.definition?.rows.find((row) => row.columns.some((col) => col.value === 'content'));
			const contentColumn = contentRow?.columns.find((col) => col.value === 'content');
			expect(contentColumn?.optional).toBe(true);
		});

		it('should mark items as required', () => {
			const itemsRow = component.description.definition?.rows.find((row) => row.columns.some((col) => col.value === 'items'));
			const itemsColumn = itemsRow?.columns.find((col) => col.value === 'items');
			expect(itemsColumn?.optional).toBe(false);
		});

		it('should mark selectedItem as required', () => {
			const selectedItemRow = component.description.definition?.rows.find((row) =>
				row.columns.some((col) => col.value === 'selectedItem')
			);
			const selectedItemColumn = selectedItemRow?.columns.find((col) => col.value === 'selectedItem');
			expect(selectedItemColumn?.optional).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should have unique ids for all items', () => {
			const ids = new Set<string>();
			const collectIds = (items: any[]) => {
				items.forEach((item) => {
					expect(ids.has(item.id)).toBe(false);
					ids.add(item.id);
					if (item.children) {
						collectIds(item.children);
					}
				});
			};
			collectIds(component.items);
		});

		it('should have valid type values for all items', () => {
			const validTypes = ['leaf', 'folder'];
			const validateTypes = (items: any[]) => {
				items.forEach((item) => {
					expect(validTypes).toContain(item.type);
					if (item.children) {
						validateTypes(item.children);
					}
				});
			};
			validateTypes(component.items);
		});

		it('should have labels for all items', () => {
			const validateLabels = (items: any[]) => {
				items.forEach((item) => {
					expect(item.label).toBeDefined();
					expect(typeof item.label).toBe('string');
					expect(item.label.length).toBeGreaterThan(0);
					if (item.children) {
						validateLabels(item.children);
					}
				});
			};
			validateLabels(component.items);
		});

		it('should have children only on folders', () => {
			const validateChildren = (items: any[]) => {
				items.forEach((item) => {
					if (item.type === 'folder') {
						expect(item.children).toBeDefined();
						expect(Array.isArray(item.children)).toBe(true);
						validateChildren(item.children);
					} else if (item.type === 'leaf') {
						expect(item.children).toBeUndefined();
					}
				});
			};
			validateChildren(component.items);
		});

		it('should have content only on leafs', () => {
			const validateContent = (items: any[]) => {
				items.forEach((item) => {
					if (item.type === 'leaf') {
						expect(item.content).toBeDefined();
					} else if (item.type === 'folder') {
						expect(item.content).toBeUndefined();
					}
					if (item.children) {
						validateContent(item.children);
					}
				});
			};
			validateContent(component.items);
		});

		it('should maintain signal reactivity after multiple selections', () => {
			component.selectedItem(42);
			expect(component.selectedItemContent()).toBe(42);

			component.selectedItem('test');
			expect(component.selectedItemContent()).toBe('test');

			component.selectedItem({ key: 'value' });
			expect(component.selectedItemContent()).toEqual({ key: 'value' });

			component.selectedItem(undefined);
			expect(component.selectedItemContent()).toBeUndefined();
		});

		it('should have definition table span set', () => {
			expect(component.description.definition?.span).toBe(12);
		});

		it('should have all definition rows with valid column counts', () => {
			component.description.definition?.rows.forEach((row) => {
				expect(row.columns.length).toBeGreaterThan(0);
				const totalSpan = row.columns.reduce((sum, col) => sum + col.span, 0);
				expect(totalSpan).toBeGreaterThan(0);
			});
		});
	});
});
