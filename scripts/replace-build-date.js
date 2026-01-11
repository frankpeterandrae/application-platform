/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */
const fs = require('fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../libs/homepage/config/src/lib/config/build-date.ts');
const currentDate = new Date().toISOString();
const fileContent = `export const BUILD_DATE = '${currentDate}';`;

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log(`Build date set to: ${currentDate}`);
