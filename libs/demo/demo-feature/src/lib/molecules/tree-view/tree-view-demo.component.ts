/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FolderItem, TreeViewComponent, type LeafItem, type TreeItems } from '@application-platform/shared/ui-theme';
import { Scopes, TranslationPipe } from '@application-platform/shared-ui';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * TreeViewDemoComponent demonstrates the usage of the TreeView component.
 */
@Component({
	selector: 'demo-tree-view',
	imports: [TreeViewComponent, DemoThemeContainerComponent, JsonPipe, TranslationPipe],
	templateUrl: './tree-view-demo.component.html'
})
export class TreeViewDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public readonly selectedItemContent = signal<unknown>(undefined);

	public readonly Scopes = Scopes;

	// Type reference to prevent organize-imports from removing FolderItem
	private readonly _folderItemType?: FolderItem;

	public description: Description = {
		title: this.i18nTextModules.TreeView.lbl.Title,
		description: this.i18nTextModules.TreeView.lbl.Description,
		usage:
			'<!-- Basic TreeView with folders and leafs -->\n' +
			'<theme-tree-view [items]="items" (selectedItem)="onItemSelected($event)"></theme-tree-view>\n\n' +
			'<!-- Component class example -->\n' +
			'export class MyComponent {\n' +
			'\tpublic items: TreeItems[] = [\n' +
			'\t\t{\n' +
			'\t\t\tlabel: "Folder 1",\n' +
			'\t\t\tid: "folder1",\n' +
			'\t\t\ttype: "folder",\n' +
			'\t\t\texpanded: false,\n' +
			'\t\t\tchildren: [...]\n' +
			'\t\t} satisfies FolderItem,\n' +
			'\t\t{\n' +
			'\t\t\tlabel: "Leaf 1",\n' +
			'\t\t\tid: "leaf1",\n' +
			'\t\t\ttype: "leaf",\n' +
			'\t\t\tcontent: "leaf content"\n' +
			'\t\t} satisfies LeafItem<string>\n' +
			'\t];\n' +
			'\n' +
			'\tpublic onItemSelected(item: unknown) {\n' +
			'\t\tconsole.log("Selected:", item);\n' +
			'\t}\n' +
			'}',
		language: 'typescript',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'items', span: 2, columntype: 'code', type: 'TreeItems[]', optional: false },
						{
							value: this.i18nTextModules.TreeView.lbl.Items,
							span: 10,
							columntype: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'selectedItem', span: 2, columntype: 'code', type: 'Output<unknown>', optional: false },
						{
							value: this.i18nTextModules.TreeView.lbl.SelectedItem,
							span: 10,
							columntype: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'LeafItem<T>', span: 2, columntype: 'code', type: 'Type', optional: false },
						{
							value: this.i18nTextModules.TreeView.lbl.LeafItem,
							span: 10,
							columntype: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'FolderItem', span: 2, columntype: 'code', type: 'Type', optional: false },
						{
							value: this.i18nTextModules.TreeView.lbl.FolderItem,
							span: 10,
							columntype: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'expanded', span: 2, columntype: 'code', type: 'boolean', optional: true },
						{
							value: this.i18nTextModules.TreeView.lbl.Expanded,
							span: 10,
							columntype: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'content', span: 2, columntype: 'code', type: 'T (generic)', optional: true },
						{
							value: this.i18nTextModules.TreeView.lbl.Content,
							span: 10,
							columntype: 'string'
						}
					]
				}
			]
		}
	};

	public items: TreeItems[] = [
		{
			label: 'Leaf 1',
			id: 'leaf1',
			type: 'leaf',
			content: 42
		} satisfies LeafItem<number>,
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
					children: [
						{
							label: 'Subleaf 1',
							id: 'subleaf1',
							type: 'leaf',
							content: 'Hello, World!'
						} satisfies LeafItem<string>
					]
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

	/**
	 * Handles the selection of an item in the TreeView and updates the selectedItemContent signal.
	 * @param $event - The content of the selected item emitted by the TreeView component.
	 */
	public selectedItem($event: unknown): void {
		this.selectedItemContent.set($event);
	}
}
