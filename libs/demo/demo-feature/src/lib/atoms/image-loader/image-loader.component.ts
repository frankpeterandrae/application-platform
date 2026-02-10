/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import { ImageLoaderComponent } from '@application-platform/shared/ui-theme';

import { DemoThemeContainerComponent } from '../../components/demo-theme-container.component';
import { Description } from '../../components/description';
import { i18nTextModules } from '../../i18n/i18n';

/**
 * ImageLoaderDemoComponent demonstrates the usage of the ImageLoader component.
 */
@Component({
	selector: 'demo-image-loader',
	imports: [ImageLoaderComponent, DemoThemeContainerComponent],
	templateUrl: './image-loader.component.html'
})
export class ImageLoaderDemoComponent {
	public readonly i18nTextModules = i18nTextModules;

	public description: Description = {
		title: i18nTextModules.ImageLoader.lbl.Title,
		description: i18nTextModules.ImageLoader.lbl.Description,
		usage:
			'<theme-image-loader\n' +
			'\t[src]="\'assets/images/example.jpg\'"\n' +
			'\t[alt]="\'Example image\'"\n' +
			'></theme-image-loader>',
		language: 'html',
		definition: {
			span: 12,
			rows: [
				{
					columns: [
						{ value: 'src', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.ImageLoader.lbl.SrcDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				},
				{
					columns: [
						{ value: 'alt', span: 1, columntype: 'code' },
						{
							value: i18nTextModules.ImageLoader.lbl.AltDescription,
							span: 5,
							columntype: 'string',
							type: 'string'
						}
					]
				}
			]
		}
	};

	// Example image paths for demonstration
	public readonly exampleImage = 'assets/demo-feature/images/example.jpg';
}
