import { resolve } from 'node:path';

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/homepage-feature'),
	plugins: [angular(), tsconfigPaths()],
	resolve: {
		alias: {
			'@application-platform/testing': resolve(__dirname, '../../shared/testing/src/index.ts'),
			'@application-platform/config': resolve(process.cwd(), 'libs/homepage/config/src/index.ts')
		}
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts', resolve(__dirname, '../../../vitest.setup.ts')],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov']
		}
	}
});
