/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { BrowserFileService } from '@application-platform/shared-ui';

import { SvgPersistence } from './svg-persistence';

/**
 * Saves SVG files using the browser download mechanism.
 */
@Injectable({
	providedIn: 'root'
})
export class BrowserSvgPersistenceService implements SvgPersistence {
	private readonly browserFileService = inject(BrowserFileService);

	/**
	 * Saves the given SVG content to a file with the specified name.
	 * @param content The SVG content to save.
	 * @param fileName The name of the file to save the content as.
	 */
	public save(content: string, fileName: string): void {
		this.browserFileService.save(content, fileName, 'image/svg+xml;charset=utf-8');
	}
}
