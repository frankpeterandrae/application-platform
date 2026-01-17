/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
	await page.goto('/');

	// Expect h1 to contain a substring.
	expect(await page.locator('h1').innerText()).toContain('Z21 UI');
});
