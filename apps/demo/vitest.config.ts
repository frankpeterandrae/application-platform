import { resolve } from 'node:path';

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/demo-app'),
	plugins: [angular(), tsconfigPaths()],
	resolve: {
		alias: {
			'@application-platform/demo-feature': resolve(__dirname, '../../libs/demo/demo-feature/src/index.ts'),
			'@application-platform/shared/ui-theme': resolve(__dirname, '../../libs/shared/ui-theme/src/index.ts'),
			'@application-platform/testing': resolve(__dirname, '../../libs/shared/testing/src/index.ts')
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
