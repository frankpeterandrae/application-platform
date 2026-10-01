/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';

import { BrowserFileService } from '../browser-file/browser-file.service';

import { FileOpenOptions, FilePersistence, FileSaveOptions } from './file-persistence';

/**
 * Provides browser-based file persistence.
 */
@Injectable({
	providedIn: 'root'
})
export class BrowserFilePersistenceService implements FilePersistence {
	private readonly browserFileService = inject(BrowserFileService);

	/**
	 * Opens a browser file picker and returns the selected file content.
	 *
	 * @param options Options controlling which file extensions can be selected.
	 * @returns The selected file content, or `null` if the dialog is cancelled.
	 */
	public open(options: FileOpenOptions): Promise<string | null> {
		return new Promise((resolve) => {
			const input = document.createElement('input');

			input.type = 'file';
			input.accept = options.extensions.map((extension) => `.${extension}`).join(',');

			input.addEventListener(
				'change',
				() => {
					const file = input.files?.[0];

					if (!file) {
						resolve(null);
						return;
					}

					void file.text().then((content) => resolve(content));
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
	 * Downloads the provided content as a file.
	 *
	 * @param content The content to save.
	 * @param options Options controlling the downloaded file.
	 * @returns A promise that resolves after the browser download has been triggered.
	 */
	public save(content: string, options: FileSaveOptions): Promise<void> {
		this.browserFileService.save(content, options.fileName, options.mimeType ?? 'text/plain;charset=utf-8');

		return Promise.resolve();
	}
}
