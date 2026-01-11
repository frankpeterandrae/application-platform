/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

const fs = require('node:fs');
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
					routes.push(path);
				}
			}
		});
	}
	ts.forEachChild(node, extractRoutes);
}

extractRoutes(sourceFile);

// Generate .htaccess rules
let htaccessContent = String.raw`
# Set expiration headers for static assets
<IfModule mod_expires.c>
    ExpiresActive On

    # Cache images, fonts, and media files for one year
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType audio/ogg "access plus 1 year"
    ExpiresByType video/mp4 "access plus 1 year"

    # Cache JavaScript and CSS files for one month
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"

    # Do not cache the main HTML file (index.html)
    <FilesMatch "index\\.html$">
        ExpiresByType text/html "access plus 0 seconds"
    </FilesMatch>
    <FilesMatch "\\.(html|htm)$">
        AddType text/html; charset=UTF-8 .html
    </FilesMatch>
</IfModule>


# Set cache control headers for better control
<IfModule mod_headers.c>
    # Enable caching for static assets
    <FilesMatch "\\.(jpg|jpeg|png|gif|svg|webp|woff2|js|css)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>

    # Disable caching for index.html and JSON files
    <FilesMatch "index\\.html$|\\.json$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
</IfModule>

# Enable the Rewrite Engine
RewriteEngine On

# Set the base URL for all subsequent rules
RewriteBase /

# Redirect all requests for /php-api to the PHP server
# RewriteEngine On
# RewriteCond %{REQUEST_URI} ^/php-api/ [NC]
# RewriteRule ^ - [L]

# Allow direct access to existing files and directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Exclude specific files from being rewritten
RewriteRule ^(robots\\.txt|sitemap\\.xml)$ - [L]

# List of known client-side routes
`;

routes.forEach((route) => {
	if (route !== '**' && !route.startsWith('dev')) {
		htaccessContent += `RewriteRule ^${route}$ /index.html [L]\n`;
	}
});

// Handle unknown routes with 404
htaccessContent += `
# For all other routes, serve index.html with a 404 status
RewriteRule ^ /index.html [R=404,L]

# Custom 404 Error Page
ErrorDocument 404 /index.html
`;

fs.mkdirSync('./libs/homepage/config/src/lib/htaccess', { recursive: true });
fs.writeFileSync('./libs/homepage/config/src/lib/htaccess/.htaccess', htaccessContent);
console.log('.htaccess file has been updated.');
