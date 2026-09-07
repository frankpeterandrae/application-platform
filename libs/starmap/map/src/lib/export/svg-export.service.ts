/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';

import { SVG_PERSISTENCE } from './svg-persistence.token';

/**
 * Service responsible for exporting rendered star maps as SVG files.
 */
@Injectable({
	providedIn: 'root'
})
export class SvgExportService {
	private readonly persistence = inject(SVG_PERSISTENCE);

	/**
	 * Exports the given SVG element as an SVG file with a name derived from the provided map name.
	 * @param svg The SVG element representing the rendered star map to export.
	 * @param mapName The name of the map, used to create the file name for the exported SVG file.
	 */
	public export(svg: SVGSVGElement, mapName: string): void {
		const content = new XMLSerializer().serializeToString(svg);

		const fileName = `${this.createFileName(mapName)}.svg`;

		this.persistence.save(content, fileName);
	}

	private createFileName(mapName: string): string {
		const normalized = mapName
			.trim()
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-_]/g, '');

		return normalized || 'starmap';
	}
}
