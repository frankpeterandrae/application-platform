/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { createFileName, FILE_PERSISTENCE } from '@application-platform/shared-ui';

/**
 * Service responsible for exporting rendered star maps as SVG files.
 */
@Injectable({
	providedIn: 'root'
})
export class SvgExportService {
	private readonly persistence = inject(FILE_PERSISTENCE);

	/**
	 * Exports the given SVG element as an SVG file with a name derived from the provided map name.
	 * @param svg The SVG element representing the rendered star map to export.
	 * @param mapName The name of the map, used to create the file name for the exported SVG file.
	 */
	public async export(svg: SVGSVGElement, mapName: string): Promise<void> {
		const content = new XMLSerializer().serializeToString(svg);

		const fileName = `${createFileName(mapName)}.svg`;

		await this.persistence.save(content, {
			fileName,
			extensions: ['svg'],
			mimeType: 'image/svg+xml;charset=utf-8'
		});
	}
}
