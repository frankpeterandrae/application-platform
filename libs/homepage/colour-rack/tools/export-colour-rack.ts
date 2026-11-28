/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { ColourRackAsset } from './colour-rack-asset';
import layout from './rack-layout.json';

class ColourRackExporter {
	private static readonly source = 'libs/stream-overlay/paint-data-access/data';
	private static readonly output = 'libs/homepage/colour-rack/src/assets/colors.json';

	static async run(check: boolean): Promise<void> {
		const [paints, matches] = await Promise.all([
			this.readJson(join(this.source, 'paint/two-thin-coats.json')),
			this.readJson(join(this.source, 'paint_match.json'))
		]);
		const colors = ColourRackAsset.build(paints, matches, layout);

		if (check) {
			// Ignore formatting changes while checking paint data and rack order.
			if (!isDeepStrictEqual(await this.readJson(this.output), colors)) {
				throw new Error(`${this.output} is out of date. Run npm exec -- nx run colour-rack:export-assets.`);
			}
			return;
		}

		const temporary = `${this.output}.${randomUUID()}.tmp`;
		try {
			await writeFile(temporary, JSON.stringify(colors, null, '\t') + '\n', 'utf8');
			await rename(temporary, this.output);
		} finally {
			await rm(temporary, { force: true });
		}
	}

	private static async readJson(path: string): Promise<unknown> {
		try {
			return JSON.parse(await readFile(path, 'utf8'));
		} catch (error) {
			throw new Error(`Cannot read paint snapshot ${path}`, { cause: error });
		}
	}
}

void ColourRackExporter.run(process.argv.includes('--check')).catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
