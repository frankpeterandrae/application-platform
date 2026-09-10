/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Injectable } from '@angular/core';
import { StarMap } from '@application-platform/starmap-domain';

import { StarMapFile } from './star-map-file.model';

/**
 * Service for serializing and deserializing star maps to and from files.
 */
@Injectable({
	providedIn: 'root'
})
export class StarMapFileService {
	/**
	 * Serializes a star map into a JSON string.
	 * @param map The star map to serialize.
	 * @returns A JSON string representing the star map.
	 */
	public serialize(map: StarMap): string {
		const file: StarMapFile = {
			version: 1,
			map
		};

		return JSON.stringify(file, null, '\t');
	}

	/**
	 * Deserializes a JSON string into a star map.
	 * @param content The JSON string to deserialize.
	 * @returns The deserialized star map.
	 */
	public deserialize(content: string): StarMap {
		const file = JSON.parse(content) as StarMapFile;

		return file.map;
	}
}
