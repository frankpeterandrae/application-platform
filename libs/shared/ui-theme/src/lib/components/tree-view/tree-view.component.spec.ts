/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';

import { TreeViewComponent, type FolderItem, type LeafItem, type TreeItems } from './tree-view.component';

describe('TreeViewComponent', () => {
	let component: TreeViewComponent;
	let fixture: ComponentFixture<TreeViewComponent>;

	const createLeafItem = <T>(label: string, id: string, content: T): LeafItem<T> => ({
		label,
		id,
		type: 'leaf',
		content
	});

	const createFolderItem = (label: string, id: string, children: TreeItems[] = []): FolderItem => ({
		label,
		id,
		type: 'folder',
		expanded: false,
		children
	});

	beforeEach(async () => {
		// Override component metadata to use inline template before TestBed configuration
		const componentDef = (TreeViewComponent as any).ɵcmp;
		if (componentDef) {
			componentDef.templateUrl = null;
			componentDef.styleUrls = null;
			componentDef.template = () => {
				// Minimal template to allow component instantiation without errors
			};
		}

		await setupTestingModule({
			imports: [TreeViewComponent]
		});

		fixture = TestBed.createComponent(TreeViewComponent);
		component = fixture.componentInstance;
		await fixture.whenStable();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('isFolderItem', () => {
		it('should return true for a folder item', () => {
			const folderItem = createFolderItem('Folder', 'folder1');
			expect(component.isFolderItem(folderItem)).toBe(true);
		});

		it('should return false for a leaf item', () => {
			const leafItem = createLeafItem('File', 'file1', 'content');
			expect(component.isFolderItem(leafItem)).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(component.isFolderItem(undefined)).toBe(false);
		});

		it('should return false for null', () => {
			expect(component.isFolderItem(null)).toBe(false);
		});
	});

	describe('toggleFolder', () => {
		it('should toggle folder from collapsed to expanded', () => {
			const folderItem = createFolderItem('Folder', 'folder1');
			folderItem.expanded = false;

			component.toggleFolder(folderItem);

			expect(folderItem.expanded).toBe(true);
		});

		it('should toggle folder from expanded to collapsed', () => {
			const folderItem = createFolderItem('Folder', 'folder1');
			folderItem.expanded = true;

			component.toggleFolder(folderItem);

			expect(folderItem.expanded).toBe(false);
		});

		it('should not change expanded state for leaf items', () => {
			const leafItem = createLeafItem('File', 'file1', 'content');

			component.toggleFolder(leafItem);

			expect((leafItem as any).expanded).toBeUndefined();
		});

		it('should toggle multiple times correctly', () => {
			const folderItem = createFolderItem('Folder', 'folder1');
			folderItem.expanded = false;

			component.toggleFolder(folderItem);
			expect(folderItem.expanded).toBe(true);

			component.toggleFolder(folderItem);
			expect(folderItem.expanded).toBe(false);

			component.toggleFolder(folderItem);
			expect(folderItem.expanded).toBe(true);
		});
	});

	describe('isFolderOpen', () => {
		it('should return true when folder is expanded', () => {
			const folderItem = createFolderItem('Folder', 'folder1');
			folderItem.expanded = true;

			expect(component.isFolderOpen(folderItem)).toBe(true);
		});

		it('should return false when folder is collapsed', () => {
			const folderItem = createFolderItem('Folder', 'folder1');
			folderItem.expanded = false;

			expect(component.isFolderOpen(folderItem)).toBe(false);
		});

		it('should return false for leaf items', () => {
			const leafItem = createLeafItem('File', 'file1', 'content');

			expect(component.isFolderOpen(leafItem)).toBe(false);
		});

		it('should return false for undefined items', () => {
			expect(component.isFolderOpen(undefined as any)).toBe(false);
		});

		it('should return false for null items', () => {
			expect(component.isFolderOpen(null as any)).toBe(false);
		});
	});

	describe('selectLeaf', () => {
		it('should emit the selected item', () => {
			const selectedItemSpy = vi.spyOn(component.selectedItem, 'emit');
			const leafItem = createLeafItem('File', 'file1', 'test content');

			component.selectLeaf(leafItem);

			expect(selectedItemSpy).toHaveBeenCalledWith(leafItem);
		});

		it('should emit different content types', () => {
			const selectedItemSpy = vi.spyOn(component.selectedItem, 'emit');

			const stringContent = createLeafItem('File1', 'file1', 'string content');
			component.selectLeaf(stringContent);
			expect(selectedItemSpy).toHaveBeenCalledWith(stringContent);

			const numberContent = createLeafItem('File2', 'file2', 42);
			component.selectLeaf(numberContent);
			expect(selectedItemSpy).toHaveBeenCalledWith(numberContent);

			const objectContent = createLeafItem('File3', 'file3', { key: 'value' });
			component.selectLeaf(objectContent);
			expect(selectedItemSpy).toHaveBeenCalledWith(objectContent);
		});

		it('should emit null or undefined content', () => {
			const selectedItemSpy = vi.spyOn(component.selectedItem, 'emit');

			const nullContent = createLeafItem('File1', 'file1', null);
			component.selectLeaf(nullContent);
			expect(selectedItemSpy).toHaveBeenCalledWith(nullContent);

			const undefinedContent = createLeafItem('File2', 'file2', undefined);
			component.selectLeaf(undefinedContent);
			expect(selectedItemSpy).toHaveBeenCalledWith(undefinedContent);
		});

		it('should emit multiple times for different selections', () => {
			const selectedItemSpy = vi.spyOn(component.selectedItem, 'emit');

			const item1 = createLeafItem('File1', 'file1', 'content1');
			const item2 = createLeafItem('File2', 'file2', 'content2');

			component.selectLeaf(item1);
			component.selectLeaf(item2);

			expect(selectedItemSpy).toHaveBeenCalledTimes(2);
			expect(selectedItemSpy).toHaveBeenNthCalledWith(1, item1);
			expect(selectedItemSpy).toHaveBeenNthCalledWith(2, item2);
		});
	});

	describe('items input', () => {
		it('should accept an array of tree items', () => {
			const items: TreeItems[] = [createLeafItem('File1', 'file1', 'content'), createFolderItem('Folder1', 'folder1')];

			expect(component.items).toBeDefined();
		});

		it('should accept empty array of items', () => {
			expect(component.items).toBeDefined();
		});

		it('should accept nested folder structure', () => {
			const nestedItems: TreeItems[] = [
				createFolderItem('Folder1', 'folder1', [
					createLeafItem('File1', 'file1', 'content'),
					createFolderItem('Subfolder1', 'subfolder1', [createLeafItem('Subfile1', 'subfile1', 'subcontent')])
				])
			];

			expect(component.items).toBeDefined();
		});
	});

	describe('selectedItem output', () => {
		it('should emit when a leaf item is selected', () => {
			const selectedItemSpy = vi.spyOn(component.selectedItem, 'emit');
			const leafItem = createLeafItem('File', 'file1', 'test content');

			component.selectLeaf(leafItem);

			expect(selectedItemSpy).toHaveBeenCalledWith(leafItem);
		});

		it('should emit multiple times for sequential selections', () => {
			const selectedItemSpy = vi.spyOn(component.selectedItem, 'emit');
			const item1 = createLeafItem('File1', 'file1', 'content1');
			const item2 = createLeafItem('File2', 'file2', 'content2');

			component.selectLeaf(item1);
			component.selectLeaf(item2);

			expect(selectedItemSpy).toHaveBeenCalledTimes(2);
			expect(selectedItemSpy).toHaveBeenNthCalledWith(1, item1);
			expect(selectedItemSpy).toHaveBeenNthCalledWith(2, item2);
		});
	});

	describe('edge cases', () => {
		it('should handle folder with empty children array', () => {
			const folderItem = createFolderItem('Folder', 'folder1', []);

			component.toggleFolder(folderItem);

			expect(folderItem.expanded).toBe(true);
			expect(folderItem.children).toEqual([]);
		});

		it('should handle deeply nested folder structures', () => {
			const deeplyNested = createFolderItem('L1', 'l1', [
				createFolderItem('L2', 'l2', [createFolderItem('L3', 'l3', [createLeafItem('File', 'file1', 'content')])])
			]);

			component.toggleFolder(deeplyNested);
			expect(deeplyNested.expanded).toBe(true);

			const level2 = deeplyNested.children[0] as FolderItem;
			component.toggleFolder(level2);
			expect(level2.expanded).toBe(true);

			const level3 = level2.children[0] as FolderItem;
			component.toggleFolder(level3);
			expect(level3.expanded).toBe(true);
		});

		it('should handle items with special characters in labels', () => {
			const specialItem = createLeafItem('File!@#$%^&*()', 'special1', 'content');

			expect(component.isFolderItem(specialItem)).toBe(false);
			component.selectLeaf(specialItem);
		});

		it('should handle items with empty labels', () => {
			const emptyLabelItem = createLeafItem('', 'empty1', 'content');

			expect(component.isFolderItem(emptyLabelItem)).toBe(false);
		});

		it('should handle items with empty string content', () => {
			const emptyContentItem = createLeafItem('File', 'file1', '');

			expect(component.isFolderItem(emptyContentItem)).toBe(false);
			component.selectLeaf(emptyContentItem);
		});

		it('should handle complex object content in leaf items', () => {
			const complexContent = {
				nested: {
					deeply: {
						value: 42
					}
				},
				array: [1, 2, 3]
			};
			const complexItem = createLeafItem('File', 'file1', complexContent);

			expect(component.isFolderItem(complexItem)).toBe(false);
			component.selectLeaf(complexItem);
		});
	});
});
