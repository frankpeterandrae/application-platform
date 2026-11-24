/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { mapRackColors } from './colour-rack-asset';
import layout from './rack-layout.json';

const source = 'libs/stream-overlay/paint-data-access/data';
const output = 'libs/homepage/colour-rack/src/assets/colors.json';

async function readJson(path: string): Promise<unknown> {
	try {
		return JSON.parse(await readFile(path, 'utf8'));
	} catch (error) {
		throw new Error(`Cannot read paint snapshot ${path}`, { cause: error });
	}
}

async function main(): Promise<void> {
	const [paints, matches] = await Promise.all([
		readJson(join(source, 'paint/two-thin-coats.json')),
		readJson(join(source, 'paint_match.json'))
	]);
	const json = `${JSON.stringify(mapRackColors(paints, matches, layout), null, '\t')}\n`;

	if (process.argv.includes('--check')) {
		if ((await readFile(output, 'utf8')) !== json) {
			throw new Error(`${output} is out of date. Run npm exec -- nx run colour-rack:export-assets.`);
		}
		return;
	}

	const temporary = `${output}.${randomUUID()}.tmp`;
	try {
		await writeFile(temporary, json, 'utf8');
		await rename(temporary, output);
	} finally {
		await rm(temporary, { force: true });
	}
}

void main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
