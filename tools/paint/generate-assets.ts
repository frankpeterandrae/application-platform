/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { paintCollections, paintMatches } from '../../libs/shared/paint/src/data';

const outputDirectory = resolve(process.cwd(), 'tmp/generated/paints');

async function writeJson(filename: string, data: unknown): Promise<void> {
	await writeFile(join(outputDirectory, filename), `${JSON.stringify(data, null, '\t')}\n`, 'utf-8');
}

async function generatePaints(): Promise<Set<string>> {
	const paintIds = new Set<string>();

	for (const [brand, collection] of Object.entries(paintCollections)) {
		const paints = Object.values(collection);

		for (const paint of paints) {
			if (paintIds.has(paint.id)) {
				throw new Error(`Duplicate paint id: ${paint.id}`);
			}

			paintIds.add(paint.id);
		}

		await writeJson(`${brand}.json`, paints);
	}

	return paintIds;
}

async function generateMatches(paintIds: ReadonlySet<string>): Promise<void> {
	const matches = paintMatches.map((paintGroup) => {
		const ids = paintGroup.map(({ id }) => id);

		if (new Set(ids).size !== ids.length) {
			throw new Error(`Duplicate paint in match group: ${ids.join(', ')}`);
		}

		for (const id of ids) {
			if (!paintIds.has(id)) {
				throw new Error(`Unknown paint in match group: ${id}`);
			}
		}

		return {
			paints: ids
		};
	});

	await writeJson('matches.json', matches);
}

async function main(): Promise<void> {
	await rm(outputDirectory, {
		recursive: true,
		force: true
	});

	await mkdir(outputDirectory, {
		recursive: true
	});

	const paintIds = await generatePaints();

	await generateMatches(paintIds);
}

void main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
