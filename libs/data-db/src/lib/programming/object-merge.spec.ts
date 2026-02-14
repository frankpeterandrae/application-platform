/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { deepMerge } from './object-merge';

describe('deepMerge', () => {
	it('returns the patch when target is not a plain object', () => {
		expect(deepMerge(null as unknown as object, { a: 1 })).toEqual({ a: 1 });
		expect(deepMerge(undefined as unknown as object, { b: 2 })).toEqual({ b: 2 });
		expect(deepMerge('string' as unknown as object, { c: 3 })).toEqual({ c: 3 });
		expect(deepMerge(123 as unknown as object, { d: 4 })).toEqual({ d: 4 });
	});

	it('returns the patch when patch is not a plain object', () => {
		const target = { a: 1, b: 2 };

		expect(deepMerge(target, null)).toBeNull();
		expect(deepMerge(target, undefined)).toBeUndefined();
		expect(deepMerge(target, 'string')).toBe('string');
		expect(deepMerge(target, 123)).toBe(123);
	});

	it('returns patch for arrays regardless of target type', () => {
		const target = { a: 1 };
		const patchArray = [1, 2, 3];

		expect(deepMerge(target, patchArray)).toEqual(patchArray);
	});

	it('merges simple flat objects with new fields', () => {
		const target = { a: 1, b: 2 };
		const patch = { c: 3 };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ a: 1, b: 2, c: 3 });
	});

	it('overwrites existing fields in target with patch values', () => {
		const target = { a: 1, b: 2 };
		const patch = { b: 20, c: 3 };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ a: 1, b: 20, c: 3 });
	});

	it('merges nested objects recursively', () => {
		const target = {
			user: {
				name: 'John',
				age: 30
			}
		};
		const patch = {
			user: {
				age: 31
			}
		};

		const result = deepMerge(target, patch);

		expect(result).toEqual({
			user: {
				name: 'John',
				age: 31
			}
		});
	});

	it('deeply merges multiple levels of nesting', () => {
		const target = {
			a: {
				b: {
					c: 1,
					d: 2
				}
			}
		};
		const patch = {
			a: {
				b: {
					d: 20
				}
			}
		};

		const result = deepMerge(target, patch);

		expect(result).toEqual({
			a: {
				b: {
					c: 1,
					d: 20
				}
			}
		});
	});

	it('replaces nested object with scalar value when patch is scalar', () => {
		const target = {
			user: {
				name: 'John',
				age: 30
			}
		};
		const patch = {
			user: 'admin'
		};

		const result = deepMerge(target, patch);

		expect(result).toEqual({
			user: 'admin'
		});
	});

	it('replaces scalar value with nested object when patch is object', () => {
		const target = {
			user: 'admin'
		};
		const patch = {
			user: {
				name: 'John',
				role: 'admin'
			}
		};

		const result = deepMerge(target, patch);

		expect(result).toEqual({
			user: {
				name: 'John',
				role: 'admin'
			}
		});
	});

	it('replaces object with array when patch is array', () => {
		const target = {
			items: { a: 1, b: 2 }
		};
		const patch = {
			items: [1, 2, 3]
		};

		const result = deepMerge(target, patch);

		expect(result).toEqual({
			items: [1, 2, 3]
		});
	});

	it('does not mutate the target object', () => {
		const target = { a: 1, b: { c: 2 } };
		const originalTarget = JSON.stringify(target);
		const patch = { b: { c: 20, d: 30 } };

		deepMerge(target, patch);

		expect(JSON.stringify(target)).toBe(originalTarget);
	});

	it('merges empty patch into target', () => {
		const target = { a: 1, b: 2 };
		const patch = {};

		const result = deepMerge(target, patch);

		expect(result).toEqual({ a: 1, b: 2 });
	});

	it('merges patch into empty target', () => {
		const target = {};
		const patch = { a: 1, b: 2 };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ a: 1, b: 2 });
	});

	it('merges two empty objects', () => {
		const target = {};
		const patch = {};

		const result = deepMerge(target, patch);

		expect(result).toEqual({});
	});

	it('preserves null values in patch when merged', () => {
		const target = { a: 1, b: 2 };
		const patch = { b: null };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ a: 1, b: null });
	});

	it('preserves undefined values in patch when merged', () => {
		const target = { a: 1, b: 2 };
		const patch = { b: undefined };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ a: 1, b: undefined });
	});

	it('handles boolean values in patch', () => {
		const target = { enabled: false, count: 0 };
		const patch = { enabled: true };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ enabled: true, count: 0 });
	});

	it('handles numeric zero and empty string as valid patch values', () => {
		const target = { count: 10, name: 'test' };
		const patch = { count: 0, name: '' };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ count: 0, name: '' });
	});

	it('merges complex nested structures with multiple types', () => {
		const target = {
			config: {
				database: {
					host: 'localhost',
					port: 5432,
					credentials: {
						user: 'admin'
					}
				},
				cache: {
					enabled: true
				}
			}
		};
		const patch = {
			config: {
				database: {
					port: 3306,
					credentials: {
						password: 'secret'
					}
				},
				timeout: 5000
			}
		};

		const result = deepMerge(target, patch);

		expect(result).toEqual({
			config: {
				database: {
					host: 'localhost',
					port: 3306,
					credentials: {
						user: 'admin',
						password: 'secret'
					}
				},
				cache: {
					enabled: true
				},
				timeout: 5000
			}
		});
	});

	it('replaces entire nested object when patch value is primitive in deeply nested structure', () => {
		const target = {
			a: {
				b: {
					c: {
						d: 1
					}
				}
			}
		};
		const patch = {
			a: {
				b: {
					c: 'replaced'
				}
			}
		};

		const result = deepMerge(target, patch);

		expect(result).toEqual({
			a: {
				b: {
					c: 'replaced'
				}
			}
		});
	});

	it('handles patches with numeric keys', () => {
		const target = { '0': 'a', '1': 'b' };
		const patch = { '1': 'B', '2': 'c' };

		const result = deepMerge(target, patch);

		expect(result).toEqual({ '0': 'a', '1': 'B', '2': 'c' });
	});

	it('returns result with preserved generic type', () => {
		interface User {
			name: string;
			age: number;
		}

		const target: User = { name: 'John', age: 30 };
		const patch = { age: 31 };

		const result: User = deepMerge(target, patch);

		expect(result.name).toBe('John');
		expect(result.age).toBe(31);
	});
});
