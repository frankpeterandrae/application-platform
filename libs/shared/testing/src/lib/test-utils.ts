/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Lightweight test utility types for Vitest
// Use these types in tests to type mock objects and spies in a consistent way.

/** A generic mock function type. Prefer `unknown` over `any` to satisfy lint rules. */
export type MockFn = (...args: unknown[]) => unknown;

/**
 * A shallow mocked shape of T where function properties are replaced with generic mocks.
 * Use for typing partial mock objects in tests.
 */
export type Mocked<T> = {
	[P in keyof T]?: T[P] extends (...args: infer A) => infer R ? (...args: A) => unknown : T[P];
};

/**
 * Utility to create a strongly-typed mock object from a partial implementation.
 * @param implementation Partial mapping of keys to mock functions
 * @returns A Mocked<T> typed object
 */
export function createMock<T>(implementation: Partial<Record<keyof T, MockFn>> = {}): Mocked<T> {
	return implementation as Mocked<T>;
}
