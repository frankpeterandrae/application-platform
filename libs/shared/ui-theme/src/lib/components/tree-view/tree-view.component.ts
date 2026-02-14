/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output } from '@angular/core';

export type LeafItem<T> = {
	label: string;
	id: string;
	type: 'leaf';
	content: T;
};

export type FolderItem = {
	label: string;
	id: string;
	type: 'folder';
	expanded: boolean;
	children: TreeItems[];
};

export type TreeItems = FolderItem | LeafItem<unknown>;

/**
 * TreeViewComponent displays a hierarchical tree structure with folders and files.
 */
@Component({
	selector: 'theme-tree-view',
	imports: [NgTemplateOutlet],
	templateUrl: './tree-view.component.html',
	styleUrl: './tree-view.component.scss'
})
export class TreeViewComponent {
	public items = input.required<TreeItems[]>();

	public selectedItem = output<unknown>();

	/**
	 * Type guard to check if a TreeItems is a FolderItem.
	 * @param {TreeItems} item - The item to check.
	 * @returns {boolean} - True if the item is a FolderItem, false otherwise.
	 */
	public isFolderItem(item: TreeItems | undefined | null): item is FolderItem {
		return item?.type === 'folder';
	}

	/**
	 * Toggles the open/closed state of a folder.
	 * @param {TreeItems} _item - The folder item to toggle.
	 */
	public toggleFolder(_item: TreeItems): void {
		if (this.isFolderItem(_item)) {
			_item.expanded = !_item.expanded;
		}
	}

	/**
	 * Checks if a folder is currently open.
	 * @param {TreeItems} _item - The folder item to check.
	 * @returns {boolean} - True if the folder is open, false otherwise.
	 */
	public isFolderOpen(_item: TreeItems): boolean {
		return this.isFolderItem(_item) ? _item.expanded : false;
	}

	/**
	 * Emits the selected leaf item.
	 * @param {unknown} item - The content of the selected leaf item to emit.
	 */
	public selectLeaf(item: unknown): void {
		this.selectedItem.emit(item);
	}
}
