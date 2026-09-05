/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */
const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../apps/homepage/src/config/build-date.ts');
const currentDate = new Date().toISOString();
const fileContent = `export const BUILD_DATE = '${currentDate}';`;

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log(`Build date set to: ${currentDate}`);
