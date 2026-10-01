/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Options for opening a text file.
 */
export interface FileOpenOptions {
	extensions: string[];
}

/**
 * Options for saving text content.
 */
export interface FileSaveOptions {
	fileName: string;
	extensions: string[];
	mimeType?: string;
}

/**
 * Abstraction for platform-specific text file persistence.
 */
export interface FilePersistence {
	/**
	 * Opens a file and returns its text content.
	 *
	 * @param options Options controlling which files can be selected.
	 * @returns The selected file content, or `null` if no file was selected.
	 */
	open(options: FileOpenOptions): Promise<string | null>;

	/**
	 * Saves the provided text content.
	 *
	 * @param content The content to save.
	 * @param options Options controlling the saved file.
	 * @returns A promise that resolves when the save operation has completed.
	 */
	save(content: string, options: FileSaveOptions): Promise<void>;
}
