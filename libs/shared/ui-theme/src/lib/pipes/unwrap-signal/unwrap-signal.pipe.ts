/*
 * Copyright (c) 2025. Frank-Peter Andrä
 * All rights reserved.
 */

import { Pipe, PipeTransform, Signal } from '@angular/core';

/**
 * UnwrapSignalPipe is an Angular pipe that handles a given value as string or as signal.
 */
@Pipe({ name: 'themeUnwrapSignal' })
export class UnwrapSignalPipe implements PipeTransform {
	/**
	 * Transform a string or Signal to a string.
	 * @param {string | Signal<string>} value - The given value.
	 * @returns {string} The string.
	 */
	public transform(value: string | Signal<string>): string {
		// At runtime a Signal is a function, so we detect it by typeof === 'function'
		if (typeof value === 'function') {
			try {
				const fn = value as unknown as () => unknown;
				const result = fn();
				if (result == null) return '';
				return typeof result === 'string' ? result : String(result);
			} catch {
				return '';
			}
		}
		return value ?? '';
	}
}
