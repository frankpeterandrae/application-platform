/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ɵSharedStylesHost } from '@angular/platform-browser';
import { CardComponent, MenuItem, SidebarComponent } from '@application-platform/shared/ui-theme';
import { Scopes, TranslationPipe } from '@application-platform/shared-ui';

import { i18nTextModules } from '../i18n/i18n';

import { Description } from './description';
import { PrismComponent } from './prism/prism.component';

/**
 * DemoThemeContainerComponent is the main layout component for demo pages.
 * It provides a sidebar, header with title, and content area.
 *
 * @Component
 */
@Component({
	selector: 'demo-theme',
	imports: [CommonModule, SidebarComponent, CardComponent, TranslationPipe, PrismComponent],
	providers: [TranslationPipe],
	styleUrls: ['./demo-theme-container.component.scss'],
	templateUrl: './demo-theme-container.component.html'
})
export class DemoThemeContainerComponent {
	private readonly sharedStyle = inject(ɵSharedStylesHost);
	private readonly translationPipe = inject(TranslationPipe);

	/** The title to display in the header. */
	public readonly title = input<string>();

	public readonly description = input<Description>({ title: '', description: '' });

	constructor() {
		this.sharedStyle.addStyles([], ['/assets/demo-feature/css/prism.css']);
	}

	/**
	 * List of menu items for the sidebar navigation, with translated labels.
	 * Each item has an id, label, and route for navigation.
	 * The labels are translated using the TranslationPipe and i18nTextModules.
	 * @return An array of MenuItem objects for the sidebar.
	 */
	public get menuItems(): MenuItem[] {
		return [
			{
				id: 'button',
				label: this.translationPipe.transform(i18nTextModules.Button.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../button'
			},
			{
				id: 'buttonBar',
				label: this.translationPipe.transform(i18nTextModules.ButtonBar.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../button-bar'
			},
			{ id: 'card', label: this.translationPipe.transform(i18nTextModules.Card.lbl.Title, Scopes.DEMO_FEATURE), route: '../card' },
			{
				id: 'checkbox',
				label: this.translationPipe.transform(i18nTextModules.Checkbox.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../checkbox'
			},
			{
				id: 'colors',
				label: this.translationPipe.transform(i18nTextModules.Colors.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../colors'
			},
			{
				id: 'dialog',
				label: this.translationPipe.transform(i18nTextModules.Dialog.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../dialog'
			},
			{
				id: 'dropdown',
				label: this.translationPipe.transform(i18nTextModules.Dropdown.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../dropdown-select'
			},
			{
				id: 'footer',
				label: this.translationPipe.transform(i18nTextModules.Footer.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../footer'
			},
			{
				id: 'header',
				label: this.translationPipe.transform(i18nTextModules.Header.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../header'
			},
			{
				id: 'icons',
				label: this.translationPipe.transform(i18nTextModules.Icon.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../icons'
			},
			{
				id: 'imageLoader',
				label: this.translationPipe.transform(i18nTextModules.ImageLoader.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../image-loader'
			},
			{
				id: 'input',
				label: this.translationPipe.transform(i18nTextModules.Input.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../input'
			},
			{
				id: 'languageToggle',
				label: this.translationPipe.transform(i18nTextModules.LanguageToggle.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../language-toggle'
			},
			{
				id: 'login',
				label: this.translationPipe.transform(i18nTextModules.Login.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../login'
			},
			{
				id: 'rangeInput',
				label: this.translationPipe.transform(i18nTextModules.RangeInput.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../range-input'
			},
			{
				id: 'select',
				label: this.translationPipe.transform(i18nTextModules.Select.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../select'
			},
			{
				id: 'tabs',
				label: this.translationPipe.transform(i18nTextModules.Tabs.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../tabs'
			},
			{
				id: 'textarea',
				label: this.translationPipe.transform(i18nTextModules.Textarea.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../textarea'
			},
			{
				id: 'tooltip',
				label: this.translationPipe.transform(i18nTextModules.Tooltip.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../tooltip'
			},
			{
				id: 'treeView',
				label: this.translationPipe.transform(i18nTextModules.TreeView.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../tree-view'
			},
			{
				id: 'typography',
				label: this.translationPipe.transform(i18nTextModules.Typography.lbl.Title, Scopes.DEMO_FEATURE),
				route: '../typography'
			}
		];
	}

	protected readonly Scopes = Scopes;
	protected readonly i18nTextModules = i18nTextModules;
}
