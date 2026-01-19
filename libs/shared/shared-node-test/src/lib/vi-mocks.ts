/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from 'vitest';

export type DeepMocked<T> = T extends (...args: any[]) => any
	? vi.MockedFunction<T>
	: T extends object
		? { [K in keyof T]: DeepMocked<T[K]> } & vi.Mocked<T>
		: T;

/**
 * Erzeugt ein Deep Mock Objekt für das gegebene Interface/Objekt
 * Alle Properties sind automatisch vi.fn() Mocks
 * Rekursiv: mock.foo.bar.baz funktioniert automatisch
 * @returns Das Mock-Objekt
 * @template T Das zu mockende Interface/Objekt
 */
export function Mock<T extends object>(): DeepMocked<T> {
	const cache = new Map<PropertyKey, any>();

	const make = (): any =>
		new Proxy(
			{},
			{
				get(_target, prop: PropertyKey): any {
					// Wichtig: verhindert, dass vi/Node das Ding als Promise interpretiert
					if (prop === 'then') return undefined;

					if (cache.has(prop)) return cache.get(prop);

					// Standard: vi.fn()
					const fn = vi.fn();
					cache.set(prop, fn);

					// Falls du später mock.foo.bar.baz brauchst:
					// - jede Property auf der Function erzeugt wieder ein Proxy-Objekt
					return new Proxy(fn, {
						get(fnTarget, innerProp: PropertyKey): any {
							if (innerProp in fnTarget) return (fnTarget as any)[innerProp];

							const nested = make();
							(fnTarget as any)[innerProp] = nested;
							return nested;
						},
						set(fnTarget, innerProp: PropertyKey, value: any): boolean {
							(fnTarget as any)[innerProp] = value;
							return true;
						}
					});
				},
				set(_target, prop: PropertyKey, value: any): boolean {
					cache.set(prop, value);
					return true;
				}
			}
		);

	return make() as DeepMocked<T>;
}

/**
 * Cleares alle Mock-Call-History in einem Objekt rekursiv
 * Wichtig: Zerstört nicht die Mocks selbst, sondern nur deren Call-History
 * @param mocks Das Mock-Objekt (oder Providers mit Mocks)
 */
export function clearAllMocks<T extends object>(mocks: T): void {
	const visited = new WeakSet<object>();

	const clearRecursive = (obj: any): void => {
		if (obj === null || typeof obj !== 'object' || visited.has(obj)) return;
		visited.add(obj);

		for (const key in obj) {
			const value = obj[key];
			if (typeof value === 'function' && typeof value.mockClear === 'function') {
				// Nur mockClear verwenden - das löscht die Call-History, zerstört aber nicht die Mock-Function selbst
				value.mockClear();
			} else if (typeof value === 'object' && value !== null) {
				clearRecursive(value);
			}
		}
	};

	clearRecursive(mocks);
}

/**
 * Hilfsfunktion für beforeEach: Löscht alle Mocks recursiv und setzt sie zurück
 * Besser als vi.clearAllMocks() da es auch in verschachtelten Objekten funktioniert
 * @param mocks Das Mock-Objekt (z.B. Providers)
 */
export function resetMocksBeforeEach<T extends object>(mocks: T): void {
	clearAllMocks(mocks);
}
