import { resolve } from 'node:path';

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: __dirname,
	cacheDir: resolve(process.cwd(), 'node_modules/.vite/homepage-app'),
	plugins: [angular(), tsconfigPaths()],
	resolve: {
		alias: {
			'@application-platform/colour-rack': resolve(__dirname, '../../libs/homepage/colour-rack/src/index.ts'),
			'@application-platform/config': resolve(__dirname, '../../libs/homepage/config/src/index.ts'),
			'@application-platform/demo-feature': resolve(__dirname, '../../libs/demo/demo-feature/src/index.ts'),
			'@application-platform/homepage-feature': resolve(__dirname, '../../libs/homepage/homepage-feature/src/index.ts'),
			'@application-platform/interfaces': resolve(__dirname, '../../libs/shared/interfaces/src/index.ts'),
			'@application-platform/services': resolve(__dirname, '../../libs/shared/services/src/index.ts'),
			'@application-platform/shared/ui-theme': resolve(__dirname, '../../libs/shared/ui-theme/src/index.ts'),
			'@application-platform/testing': resolve(__dirname, '../../libs/shared/testing/src/index.ts'),
			'@application-platform/domain': resolve(__dirname, '../../libs/z21-suite/domain/src/index.ts'),
			'@application-platform/protocol': resolve(__dirname, '../../libs/z21-suite/protocol/src/index.ts'),
			'@application-platform/z21': resolve(__dirname, '../../libs/z21-suite/z21/src/index.ts')
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
