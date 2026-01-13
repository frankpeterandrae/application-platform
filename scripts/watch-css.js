/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

const sass = require('sass');

const fs = require('node:fs').promises;
const path = require('node:path');

// Watch for changes
const chokidar = require('chokidar');

/**
 * Function to compile SCSS
 */
function compileSass() {
	(async () => {
		try {
			// Define paths
			const scssPath = path.join(__dirname, 'libs/shared/ui-theme/src/lib/theme/styles.scss');
			const cssOutputPath = path.join(__dirname, 'libs/shared/ui-theme/src/lib/theme'); // Output to lib root
			const outputFileName = 'styles.css'; // Desired CSS file name

			// Compile SCSS to CSS using compileAsync
			const result = await sass.compileAsync(scssPath, {
				style: 'compressed' // 'compressed' or 'expanded'
				// Include additional options if necessary
			});

			result.css = result.css.replaceAll(/\/\*!.*?Frank-Peter Andrä.*?\*\//gs, '');
			// Write the compiled CSS to the desired output file
			await fs.writeFile(path.join(path.dirname(cssOutputPath), outputFileName), result.css);

			console.log(`CSS successfully compiled to ${outputFileName}`);
		} catch (error) {
			console.error('SASS compilation error:', error);
			process.exit(1);
		}
	})();
}

// Initial compilation
compileSass();

// Initialize watcher.
const watcher = chokidar.watch(path.join(__dirname, 'libs/shared/ui-theme/src/lib/theme/**/*.scss'), {
	persistent: true,
	ignoreInitial: true
});

// Add event listeners.
watcher
	.on('add', (filePath) => {
		console.log(`File added: ${filePath}. Recompiling CSS...`);
		compileSass();
	})
	.on('change', (filePath) => {
		console.log(`File changed: ${filePath}. Recompiling CSS...`);
		compileSass();
	})
	.on('unlink', (filePath) => {
		console.log(`File removed: ${filePath}. Recompiling CSS...`);
		compileSass();
	});
