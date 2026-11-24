/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { createCoverageReport, loadCoverage, writeCoverageReport, writeMergedLcov } from './coverage-utils';

async function main(): Promise<void> {
	const coverage = await loadCoverage();
	const report = createCoverageReport(coverage);

	const [jsonFile, lcovFile] = await Promise.all([writeCoverageReport(report, 'coverage-report.json'), writeMergedLcov(coverage)]);

	console.log(`Coverage report contains ${report.files.length} file(s).`);
	console.log(`Written to ${jsonFile}`);
	console.log(`Merged LCOV written to ${lcovFile}`);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
