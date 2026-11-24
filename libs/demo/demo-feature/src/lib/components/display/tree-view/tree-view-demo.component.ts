/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TreeViewComponent, type FolderItem, type LeafItem, type TreeItems } from '@application-platform/shared/ui-theme';
import { Scopes, TranslationPipe } from '@application-platform/shared-ui';

import { i18nTextModules } from '../../../i18n/i18n';
import { DemoThemeContainerComponent } from '../../demo-theme-container.component';
import { Description } from '../../description';

/** Displays tree view usage examples. */
@Component({
	selector: 'demo-tree-view',
	imports: [TreeViewComponent, DemoThemeContainerComponent, JsonPipe, TranslationPipe],
	templateUrl: './tree-view-demo.component.html'
})
export class TreeViewDemoComponent {
	protected readonly i18nTextModules = i18nTextModules;
	protected readonly Scopes = Scopes;
	protected readonly selectedItemContent = signal<unknown>(undefined);

	protected readonly description: Description = {
		title: i18nTextModules.TreeView.lbl.Title,
		description: i18nTextModules.TreeView.lbl.Description,
		usage:
			'<!-- Basic TreeView with folders and leafs -->\n' +
			'<theme-tree-view [items]="items" (selectedItem)="onItemSelected($event)"></theme-tree-view>\n\n' +
			'<!-- Component class example -->\n' +
			'export class MyComponent {\n' +
			'\tpublic items: TreeItems[] = [\n' +
			'\t\t{ label: "Folder 1", id: "folder1", type: "folder", expanded: false, children: [...] } satisfies FolderItem,\n' +
			'\t\t{ label: "Leaf 1", id: "leaf1", type: "leaf", content: "leaf content" } satisfies LeafItem<string>\n' +
			'\t];\n' +
			'}',
		language: 'typescript',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'items', span: 2, columntype: 'code', type: 'TreeItems[]', optional: false },
						{ value: i18nTextModules.TreeView.lbl.Items, span: 10, columntype: 'string' }
					]
				},
				{
					columns: [
						{ value: 'selectedItem', span: 2, columntype: 'code', type: 'Output<unknown>', optional: false },
						{ value: i18nTextModules.TreeView.lbl.SelectedItem, span: 10, columntype: 'string' }
					]
				},
				{
					columns: [
						{ value: 'LeafItem<T>', span: 2, columntype: 'code', type: 'Type', optional: false },
						{ value: i18nTextModules.TreeView.lbl.LeafItem, span: 10, columntype: 'string' }
					]
				},
				{
					columns: [
						{ value: 'FolderItem', span: 2, columntype: 'code', type: 'Type', optional: false },
						{ value: i18nTextModules.TreeView.lbl.FolderItem, span: 10, columntype: 'string' }
					]
				},
				{
					columns: [
						{ value: 'expanded', span: 2, columntype: 'code', type: 'boolean', optional: true },
						{ value: i18nTextModules.TreeView.lbl.Expanded, span: 10, columntype: 'string' }
					]
				},
				{
					columns: [
						{ value: 'content', span: 2, columntype: 'code', type: 'T (generic)', optional: true },
						{ value: i18nTextModules.TreeView.lbl.Content, span: 10, columntype: 'string' }
					]
				}
			]
		}
	};

	protected readonly items: TreeItems[] = [
		{ label: 'Leaf 1', id: 'leaf1', type: 'leaf', content: 42 } satisfies LeafItem<number>,
		{
			label: 'Folder 1',
			id: 'folder1',
			type: 'folder',
			expanded: false,
			children: [
				{
					label: 'Subfolder 1',
					id: 'subfolder1',
					type: 'folder',
					expanded: false,
					children: [{ label: 'Subleaf 1', id: 'subleaf1', type: 'leaf', content: 'Hello, World!' } satisfies LeafItem<string>]
				} satisfies FolderItem,
				{
					label: 'Subleaf 2',
					id: 'subleaf2',
					type: 'leaf',
					content: { message: 'This is a leaf content' }
				} satisfies LeafItem<object>
			]
		} satisfies FolderItem
	];

	protected selectedItem(content: unknown): void {
		this.selectedItemContent.set(content);
	}
}
