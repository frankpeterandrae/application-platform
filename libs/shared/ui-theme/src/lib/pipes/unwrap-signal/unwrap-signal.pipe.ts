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
		return typeof value === 'function' ? (value as any)() : value;
	}
}
