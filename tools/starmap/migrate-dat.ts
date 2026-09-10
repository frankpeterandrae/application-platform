/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

import type {
	JumpLink,
	JumpLinkStatus,
	Nebula,
	NebulaType,
	Planet,
	PlanetType,
	StarMap,
	StarSystem
} from '@application-platform/starmap-domain';

interface StarMapFile {
	version: 1;
	map: StarMap;
}

const PLANET_TYPES: PlanetType[] = ['terran', 'barren', 'gas_giant', 'ice', 'ocean', 'desert', 'volcanic', 'other'];

const JUMP_LINK_STATUSES: JumpLinkStatus[] = ['normal', 'caution', 'dangerous', 'blocked', 'lost'];

const NEBULA_TYPES: NebulaType[] = ['cloud', 'outline', 'haze'];

function main(): void {
	const [, , inputPath, outputPath, mapNameArg] = process.argv;

	if (!inputPath) {
		throw new Error('Usage: migrate-dat.ts <input.dat> [output.json] [map-name]');
	}

	const mapName = mapNameArg ?? basename(inputPath, extname(inputPath));

	const content = readFileSync(inputPath, 'utf8');
	const map = parseLegacyDat(content, mapName);

	const file: StarMapFile = {
		version: 1,
		map
	};

	const targetPath = outputPath ?? inputPath.replace(/\.dat$/i, '.json');

	writeFileSync(targetPath, JSON.stringify(file, null, '\t'), 'utf8');

	console.log(`Migrated ${inputPath} -> ${targetPath}`);
	console.log(`Systems: ${map.systems.length}`);
	console.log(`Planets: ${map.systems.reduce((count, system) => count + system.planets.length, 0)}`);
	console.log(`Jump links: ${map.jumpLinks.length}`);
	console.log(`Nebulae: ${map.nebulae.length}`);
}

function parseLegacyDat(content: string, mapName: string): StarMap {
	const lines = content.split(/\r?\n/).map((line) => line.trim());

	const systems: StarSystem[] = [];
	const jumpLinks: JumpLink[] = [];
	const nebulae: Nebula[] = [];

	const systemIds = new Map<string, string>();

	let planetCounter = 0;
	let jumpLinkCounter = 0;
	let nebulaCounter = 0;

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];

		if (!line) {
			continue;
		}

		if (line.startsWith('Map Minimum:') || line.startsWith('Map Maximum:')) {
			continue;
		}

		if (line.startsWith('Name: ')) {
			const name = line.substring('Name: '.length);

			const coordinates = requireLine(lines, ++index, 'Coordinates:');

			const numberOfStars = requireLine(lines, ++index, 'Number of Stars:');

			const spectralTypes = requireLine(lines, ++index, 'Spectral Types:');

			const position = parseCoordinates(coordinates);
			const expectedStarCount = Number.parseInt(numberOfStars.substring('Number of Stars:'.length).trim(), 10);

			const starTypes = spectralTypes
				.substring('Spectral Types:'.length)
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean);

			if (starTypes.length !== expectedStarCount) {
				throw new Error(`System "${name}" declares ${expectedStarCount} stars but contains ${starTypes.length} spectral types.`);
			}

			const id = createId('S', systems.length + 1);

			if (systemIds.has(name)) {
				throw new Error(`Duplicate system name "${name}".`);
			}

			systemIds.set(name, id);

			systems.push({
				id,
				name,
				position,
				stars: starTypes.map((spectralType) => ({
					spectralType
				})),
				planets: []
			});

			continue;
		}

		if (line.startsWith('Faction: ')) {
			const [systemName, faction] = parseQuotedValues(line, 'Faction', 2);

			const system = requireSystem(systems, systemIds, systemName);

			system.faction = faction;

			continue;
		}

		if (line.startsWith('Planet: ')) {
			const [systemName, planetName, planetTypeValue, classification] = parseQuotedValues(line, 'Planet', 4);

			const system = requireSystem(systems, systemIds, systemName);

			const planetType = parsePlanetType(planetTypeValue);

			planetCounter++;

			const planet: Planet = {
				id: createId('P', planetCounter),
				name: planetName,
				type: planetType,
				classification
			};

			system.planets.push(planet);

			continue;
		}

		if (line.startsWith('Link: ')) {
			const [startSystemName, endSystemName, statusValue] = parseQuotedValues(line, 'Link', 3);

			const startSystemId = requireSystemId(systemIds, startSystemName);

			const endSystemId = requireSystemId(systemIds, endSystemName);

			const status = parseJumpLinkStatus(statusValue);

			jumpLinkCounter++;

			jumpLinks.push({
				id: createId('J', jumpLinkCounter),
				startSystemId,
				endSystemId,
				status
			});

			continue;
		}

		if (line.startsWith('Nebula: ')) {
			const name = line.substring('Nebula: '.length);

			const styleLine = requireLine(lines, ++index, 'Style:');

			const colorLine = requireLine(lines, ++index, 'Color:');

			const opacityLine = requireLine(lines, ++index, 'Opacity:');

			const pointsLine = requireLine(lines, ++index, 'Points:');

			nebulaCounter++;

			nebulae.push({
				id: createId('N', nebulaCounter),
				name,
				style: parseNebulaType(styleLine.substring('Style:'.length).trim()),
				color: colorLine.substring('Color:'.length).trim() as `#${string}`,
				opacity: Number.parseFloat(opacityLine.substring('Opacity:'.length).trim()),
				points: parseNebulaPoints(pointsLine)
			});

			continue;
		}

		throw new Error(`Unknown legacy line ${index + 1}: ${line}`);
	}

	return {
		id: createMapId(mapName),
		name: mapName,
		systems,
		jumpLinks,
		nebulae
	};
}

function requireLine(lines: string[], index: number, prefix: string): string {
	const line = lines[index];

	if (!line?.startsWith(prefix)) {
		throw new Error(`Expected "${prefix}" at line ${index + 1}.`);
	}

	return line;
}

function parseCoordinates(line: string): {
	x: number;
	y: number;
	z: number;
} {
	const match = /^Coordinates:\s*\((-?\d+),\s*(-?\d+),\s*(-?\d+)\)$/.exec(line);

	if (!match) {
		throw new Error(`Invalid coordinate line: ${line}`);
	}

	return {
		x: Number(match[1]),
		y: Number(match[2]),
		z: Number(match[3])
	};
}

function parseNebulaPoints(line: string): {
	x: number;
	y: number;
	z: number;
}[] {
	const content = line.substring('Points:'.length);
	const regex = /\((-?\d+),\s*(-?\d+)\)/g;

	return Array.from(content.matchAll(regex)).map(([, x, y]) => ({
		x: Number(x),
		y: Number(y),
		z: 0
	}));
}

function parseQuotedValues(line: string, type: string, expectedCount: number): string[] {
	const values = Array.from(line.matchAll(/"([^"]*)"/g), (match) => match[1]);

	if (values.length !== expectedCount) {
		throw new Error(`Invalid ${type} line: ${line}`);
	}

	return values;
}

function requireSystem(systems: StarSystem[], systemIds: Map<string, string>, name: string): StarSystem {
	const id = requireSystemId(systemIds, name);

	const system = systems.find((candidate) => candidate.id === id);

	if (!system) {
		throw new Error(`System "${name}" does not exist.`);
	}

	return system;
}

function requireSystemId(systemIds: Map<string, string>, name: string): string {
	const id = systemIds.get(name);

	if (!id) {
		throw new Error(`Unknown system "${name}".`);
	}

	return id;
}

function parsePlanetType(value: string): PlanetType {
	if (!PLANET_TYPES.includes(value as PlanetType)) {
		throw new Error(`Unknown planet type "${value}".`);
	}

	return value as PlanetType;
}

function parseJumpLinkStatus(value: string): JumpLinkStatus {
	if (!JUMP_LINK_STATUSES.includes(value as JumpLinkStatus)) {
		throw new Error(`Unknown jump link status "${value}".`);
	}

	return value as JumpLinkStatus;
}

function parseNebulaType(value: string): NebulaType {
	if (!NEBULA_TYPES.includes(value as NebulaType)) {
		throw new Error(`Unknown nebula type "${value}".`);
	}

	return value as NebulaType;
}

function createId(prefix: string, index: number): string {
	return `${prefix}${String(index).padStart(3, '0')}`;
}

function createMapId(name: string): string {
	const id = name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-_]/g, '');

	return id || 'starmap';
}

main();
