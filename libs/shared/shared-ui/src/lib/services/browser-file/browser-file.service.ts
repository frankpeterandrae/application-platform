/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';

/**
 * Saves text content using the browser download mechanism.
 */
@Injectable({
	providedIn: 'root'
})
export class BrowserFileService {
	/**
	 * Triggers a browser download for the provided content.
	 *
	 * @param content The content to save.
	 * @param fileName The file name used for the download.
	 * @param mimeType The MIME type of the generated file.
	 * @returns Nothing.
	 */
	public save(content: string, fileName: string, mimeType: string): void {
		const blob = new Blob([content], {
			type: mimeType
		});

		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = fileName;

		link.click();

		URL.revokeObjectURL(url);
	}
}
