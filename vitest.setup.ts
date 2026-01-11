/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

// Global Vitest setup: provide jest->vi compatibility and TestBed reset helpers
// Map commonly used jest globals to Vitest 'vi' so existing tests don't need changes.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof (globalThis as any).jest === 'undefined') {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	(globalThis as any).jest = {
		fn: (...args: any[]) => (globalThis as any).vi.fn(...args),
		spyOn: (globalThis as any).vi.spyOn,
		clearAllMocks: () => (globalThis as any).vi.clearAllMocks(),
		resetAllMocks: () => (globalThis as any).vi.resetAllMocks()
		// Add more mappings here if needed
	};
}

// Provide global beforeEach/afterEach to reset Vitest mocks between tests
beforeEach(() => {
	(globalThis as any).vi.resetAllMocks();
});

afterEach(() => {
	(globalThis as any).vi.resetAllMocks();
});
