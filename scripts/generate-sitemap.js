/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

const fs = require('fs');
const ts = require('typescript');

const filePath = './apps/homepage/src/app/app.routes.ts';
const fileContent = fs.readFileSync(filePath, 'utf-8');

const sourceFile = ts.createSourceFile('app.routes.ts', fileContent, ts.ScriptTarget.Latest, true);
const routes = [];

function extractRoutes(node) {
	if (ts.isArrayLiteralExpression(node)) {
		node.elements.forEach((element) => {
			if (ts.isObjectLiteralExpression(element)) {
				const pathProperty = element.properties.find((prop) => prop.name && prop.name.text === 'path');
				if (pathProperty && ts.isPropertyAssignment(pathProperty)) {
					const path = pathProperty.initializer.text;
					if (path !== '**' && !path.startsWith('dev')) {
						// Exclude dev routes in production
						routes.push(path);
					}
				}
			}
		});
	}
	ts.forEachChild(node, extractRoutes);
}

extractRoutes(sourceFile);

// Generate sitemap.xml
let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

routes.forEach((route) => {
	sitemapContent += `
  <url>
    <loc>https:/frankpeterandrae.de/${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  `;
});

sitemapContent += `</urlset>`;

fs.mkdirSync('./libs/homepage/config/src/lib/sitemap', { recursive: true });
fs.writeFileSync('./libs/homepage/config/src/lib/sitemap/sitemap.xml', sitemapContent.trim());
console.log('sitemap.xml has been generated.');
