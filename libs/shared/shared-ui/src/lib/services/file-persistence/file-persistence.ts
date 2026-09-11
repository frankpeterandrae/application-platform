/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { InjectionToken } from '@angular/core';

export interface FileOpenOptions {
	extensions: string[];
}

export interface FileSaveOptions {
	fileName: string;
	extensions: string[];
	mimeType?: string;
}

export interface FilePersistence {
	open(options: FileOpenOptions): Promise<string | null>;
	save(content: string, options: FileSaveOptions): Promise<void>;
}

export const FILE_PERSISTENCE = new InjectionToken<FilePersistence>('FILE_PERSISTENCE');
