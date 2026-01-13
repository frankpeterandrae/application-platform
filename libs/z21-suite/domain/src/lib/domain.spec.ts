/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { domain } from './domain';

describe('domain', () => {
	it('should return the string domain', () => {
		expect(domain()).toEqual('domain');
	});
});
