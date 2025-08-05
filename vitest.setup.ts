/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Ensure Angular JIT compiler is available globally for tests that need JIT fallback
import '@angular/compiler';

/// <reference types="vitest" />
import { afterEach, beforeEach } from 'vitest';

// Global Vitest setup: TestBed reset helpers
// Keep global resets for Vitest mocks.

// Provide global beforeEach/afterEach to reset Vitest mocks between tests
beforeEach(() => {
	(globalThis as any).vi.resetAllMocks();
});

afterEach(() => {
	(globalThis as any).vi.resetAllMocks();
});
