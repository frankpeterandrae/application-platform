/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/// <reference types="vitest" />

// Global ambient types for Vitest to ensure editor recognizes test globals like beforeEach/afterEach
// This file is included by tsconfig.base.json and ensures the TS language service provides the correct types.

declare global {
	/**
	 * Legacy test helper used in some specs (expects Jasmine-like global `fail`).
	 */
	function fail(message?: string): void;

	/**
	 * Allow common mock helpers on functions to match Jest/Vitest mock usage in spez21.
	 * This is intentionally permissive to avoid widespread test-type errors during migration.
	 */
	interface Function {
		mockReturnValue?: (...args: any[]) => any;
		mockReturnValueOnce?: (...args: any[]) => any;
		mockClear?: () => void;
		mockReset?: () => void;
	}

	interface CallableFunction {
		mockReturnValue?: (...args: any[]) => any;
		mockReturnValueOnce?: (...args: any[]) => any;
		mockClear?: () => void;
		mockReset?: () => void;
	}

	// Provide a permissive ambient `vi` namespace so code that references `vi.MockedFunction` etc. type-checks
	// (Vitest provides globals at runtime; this namespace gives the compiler the names it expects).

	// Also provide a global value `vi` so value-level references resolve; namespace + value will merge.
	const vi: any;
	namespace vi {
		type Mock = any;
		type MockInstance<T = any> = any;
		type MockedFunction<T = any> = any;
		type Mocked<T = any> = any;
		// Common helpers used in the codebase
		function fn<T extends (...args: any[]) => any>(impl?: T): any;
		function spyOn(...args: any[]): any;
		function useFakeTimers(...args: any[]): any;
		function useRealTimers(...args: any[]): any;
		function advanceTimersByTime(ms: number): void;
		function clearAllMocks(): void;
	}
}

export {};
