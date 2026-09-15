/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SONAR_URL = 'https://sonarcloud.io';
const PROJECT_KEY = 'frankpeterandrae_angular-apps';

interface SonarIssue {
	readonly key: string;
	readonly rule: string;
	readonly severity: string;
	readonly component: string;
	readonly line?: number;
	readonly message: string;
	readonly type?: string;
}

interface SonarIssueResponse {
	readonly issues: SonarIssue[];
	readonly paging: {
		readonly pageIndex: number;
		readonly pageSize: number;
		readonly total: number;
	};
}

async function main(): Promise<void> {
	const pullRequest = process.argv[2];

	if (!pullRequest) {
		throw new Error('Missing pull request number. Usage: npm run sonar:pr-findings -- <pr-number>');
	}

	const pageSize = 500;
	let page = 1;

	const issues: SonarIssue[] = [];

	while (true) {
		const url = new URL('/api/issues/search', SONAR_URL);

		url.searchParams.set('componentKeys', PROJECT_KEY);
		url.searchParams.set('pullRequest', pullRequest);
		url.searchParams.set('issueStatuses', 'OPEN,CONFIRMED');
		url.searchParams.set('inNewCodePeriod', 'true');
		url.searchParams.set('ps', String(pageSize));
		url.searchParams.set('p', String(page));

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Sonar request failed: ${response.status} ${response.statusText}`);
		}

		const result = (await response.json()) as SonarIssueResponse;

		issues.push(...result.issues);

		if (issues.length >= result.paging.total) {
			break;
		}

		page++;
	}

	const findings = issues.map((issue) => ({
		key: issue.key,
		rule: issue.rule,
		severity: issue.severity,
		file: issue.component.replace(`${PROJECT_KEY}:`, ''),
		line: issue.line,
		message: issue.message,
		type: issue.type
	}));

	const outputDirectory = resolve(process.cwd(), 'tmp/sonar');
	const outputFile = resolve(outputDirectory, `sonar-pr-${pullRequest}.json`);

	await mkdir(outputDirectory, {
		recursive: true
	});

	await writeFile(outputFile, JSON.stringify(findings, null, 2), 'utf8');

	if (findings.length === 0) {
		console.log(`No open Sonar findings for PR #${pullRequest}.`);
	} else {
		console.log(`Downloaded ${findings.length} Sonar finding(s) for PR #${pullRequest}.`);
	}

	console.log(`Written to ${outputFile}`);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
