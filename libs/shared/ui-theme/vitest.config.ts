import { resolve } from 'node:path';

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/shared-ui-theme'),
	plugins: [angular(), tsconfigPaths()],
	resolve: {
		alias: {
			'@application-platform/testing': resolve(process.cwd(), 'libs/shared/testing/src/index.ts'),
			'@application-platform/interfaces': resolve(process.cwd(), 'libs/shared/interfaces/src/index.ts')
		}
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test-setup.ts'],
		include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov']
		}
	}
});
