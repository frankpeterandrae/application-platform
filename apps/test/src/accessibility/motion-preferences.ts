/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export function prefersReducedMotion(): boolean {
	return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function effectiveCharactersPerSecond(requested: number, respectReducedMotion: boolean): number {
	return respectReducedMotion && prefersReducedMotion() ? 0 : requested;
}
