/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { FileOpenOptions, FilePersistence, FileSaveOptions } from '@application-platform/shared-ui';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

/**
 * Persists starmap data using the configured file persistence backend.
 */
@Injectable()
export class TauriFilePersistenceService implements FilePersistence {
	/**
	 * Persists starmap data using the configured file persistence backend.
	 *
	 * @param content - The content to write (typically serialized data).
	 * @param options - Persistence options such as destination path and write behavior.
	 */
	public async open(options: FileOpenOptions): Promise<string | null> {
		const path = await open({
			multiple: false,
			directory: false,
			filters: [
				{
					name: 'Datei',
					extensions: options.extensions
				}
			]
		});

		if (!path) {
			return null;
		}

		return readTextFile(path);
	}

	/**
	 * Loads starmap data using the configured file persistence backend.
	 *
	 * @param options - Read options such as source path and parsing behavior.
	 */
	public async save(content: string, options: FileSaveOptions): Promise<void> {
		const path = await save({
			defaultPath: options.fileName,
			filters: [
				{
					name: 'Datei',
					extensions: options.extensions
				}
			]
		});

		if (!path) {
			return;
		}

		await writeTextFile(path, content);
	}
}
