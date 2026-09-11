/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';

import { BrowserFileService } from '../browser-file/browser-file.service';

import { FileOpenOptions, FilePersistence, FileSaveOptions } from './file-persistence';

/**
 * BrowserFilePersistenceService is an Angular service that implements the FilePersistence interface.
 * It provides methods to open and save files in a browser environment using the BrowserFileService.
 */
@Injectable({
	providedIn: 'root'
})
export class BrowserFilePersistenceService implements FilePersistence {
	private readonly browserFileService = inject(BrowserFileService);

	/**
	 * Opens a file dialog for the user to select a file to open. The selected file's content is read as text and returned as a Promise.
	 * @param options - An object containing the file extensions that are allowed to be opened.
	 * @returns A Promise that resolves to the content of the selected file as a string, or null if no file was selected.
	 */
	public open(options: FileOpenOptions): Promise<string | null> {
		return new Promise((resolve) => {
			const input = document.createElement('input');

			input.type = 'file';
			input.accept = options.extensions.map((extension) => `.${extension}`).join(',');

			input.addEventListener(
				'change',
				async () => {
					const file = input.files?.[0];

					resolve(file ? await file.text() : null);
				},
				{ once: true }
			);

			input.addEventListener('cancel', () => resolve(null), {
				once: true
			});

			input.click();
		});
	}

	/**
	 * Saves the provided content to a file with the specified options. The file is saved using the BrowserFileService.
	 * @param content - The content to be saved to the file.
	 * @param options - An object containing the file name, allowed extensions, and optional MIME type for the file to be saved.
	 * @returns A Promise that resolves when the file has been saved.
	 */
	public save(content: string, options: FileSaveOptions): Promise<void> {
		this.browserFileService.save(content, options.fileName, options.mimeType ?? 'text/plain;charset=utf-8');

		return Promise.resolve();
	}
}
