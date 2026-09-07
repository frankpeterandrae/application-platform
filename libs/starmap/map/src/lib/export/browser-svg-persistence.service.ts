/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';

import { SvgPersistence } from './svg-persistence';

/**
 * Saves SVG files using the browser download mechanism.
 */
@Injectable({
	providedIn: 'root'
})
export class BrowserSvgPersistenceService implements SvgPersistence {
	/**
	 * Saves the given SVG content to a file with the specified name.
	 * @param content The SVG content to save.
	 * @param fileName The name of the file to save the content as.
	 */
	public save(content: string, fileName: string): void {
		const blob = new Blob([content], {
			type: 'image/svg+xml;charset=utf-8'
		});

		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');

		link.href = url;
		link.download = fileName;

		link.click();

		URL.revokeObjectURL(url);
	}
}
