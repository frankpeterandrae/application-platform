/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface MetricSummary {
	readonly covered: number;
	readonly total: number;
	readonly percent: number | null;
}

export interface FileCoverageReport {
	readonly file: string;
	readonly coverage: MetricSummary;
	readonly lines: MetricSummary;
	readonly functions: MetricSummary;
	readonly branches: MetricSummary;
	readonly uncoveredLines: number[];
}

export interface CoverageReport {
	readonly summary: {
		readonly coverage: MetricSummary;
		readonly lines: MetricSummary;
		readonly functions: MetricSummary;
		readonly branches: MetricSummary;
	};
	readonly files: FileCoverageReport[];
}

interface FunctionCoverage {
	line: number;
	hits: number;
	name: string;
}

interface BranchCoverage {
	line: number;
	block: string;
	branch: string;
	hits: number | null;
}

interface FileCoverage {
	file: string;
	lines: Map<number, number>;
	functions: Map<string, FunctionCoverage>;
	branches: Map<string, BranchCoverage>;
}

export async function loadCoverage(): Promise<Map<string, FileCoverage>> {
	const reports: string[] = [];

	for await (const file of glob('test-result/**/lcov.info')) {
		reports.push(file);
	}

	if (reports.length === 0) {
		throw new Error('No lcov.info files found below test-result. Run the tests with coverage first.');
	}

	const exclusions = await loadCoverageExclusions();
	const merged = new Map<string, FileCoverage>();

	for (const report of reports.sort()) {
		const content = await readFile(report, 'utf8');
		mergeLcov(merged, content, exclusions, report);
	}

	return merged;
}

export function createCoverageReport(
	coverage: Map<string, FileCoverage>,
	lineFilter?: ReadonlyMap<string, ReadonlySet<number>>
): CoverageReport {
	const files = [...coverage.values()]
		.map((file) => {
			if (lineFilter && !lineFilter.has(file.file)) {
				return null;
			}

			return createFileReport(file, lineFilter?.get(file.file));
		})
		.filter((file): file is FileCoverageReport => file !== null)
		.sort((left, right) => left.file.localeCompare(right.file));

	const lines = mergeMetrics(files.map(({ lines }) => lines));
	const functions = mergeMetrics(files.map(({ functions }) => functions));
	const branches = mergeMetrics(files.map(({ branches }) => branches));

	return {
		summary: {
			coverage: combineCoverage(lines, branches),
			lines,
			functions,
			branches
		},
		files
	};
}

export async function writeCoverageReport(report: CoverageReport, fileName: string, extra: Record<string, unknown> = {}): Promise<string> {
	const outputDirectory = resolve(process.cwd(), 'tmp/coverage');
	const outputFile = resolve(outputDirectory, fileName);

	await mkdir(outputDirectory, { recursive: true });
	await writeFile(outputFile, JSON.stringify({ ...extra, ...report }, null, 2), 'utf8');

	return outputFile;
}

export async function writeMergedLcov(coverage: Map<string, FileCoverage>): Promise<string> {
	const outputDirectory = resolve(process.cwd(), 'tmp/coverage');
	const outputFile = resolve(outputDirectory, 'lcov.info');

	await mkdir(outputDirectory, { recursive: true });
	await writeFile(outputFile, serializeLcov(coverage), 'utf8');

	return outputFile;
}

function mergeLcov(target: Map<string, FileCoverage>, content: string, exclusions: RegExp[], reportPath: string): void {
	for (const record of content.split('end_of_record')) {
		const source = /^SF:(.+)$/m.exec(record)?.[1]?.trim();

		if (!source) {
			continue;
		}

		const file = normalizePath(source, reportPath);

		if (exclusions.some((pattern) => pattern.test(file))) {
			continue;
		}

		const coverage = getOrCreateFile(target, file);
		const functionLines = new Map<string, number>();

		for (const line of record.split(/\r?\n/)) {
			if (line.startsWith('DA:')) {
				const [lineNumber, hits] = line.slice(3).split(',');
				mergeLine(coverage, Number(lineNumber), Number(hits));
			} else if (line.startsWith('FN:')) {
				const comma = line.indexOf(',', 3);
				if (comma > 0) {
					functionLines.set(line.slice(comma + 1), Number(line.slice(3, comma)));
				}
			} else if (line.startsWith('FNDA:')) {
				const comma = line.indexOf(',', 5);
				if (comma > 0) {
					const name = line.slice(comma + 1);
					const functionLine = functionLines.get(name) ?? 0;
					mergeFunction(coverage, functionLine, name, Number(line.slice(5, comma)));
				}
			} else if (line.startsWith('BRDA:')) {
				const [lineNumber, block, branch, rawHits] = line.slice(5).split(',');
				mergeBranch(coverage, Number(lineNumber), block, branch, rawHits === '-' ? null : Number(rawHits));
			}
		}
	}
}

function getOrCreateFile(target: Map<string, FileCoverage>, file: string): FileCoverage {
	const existing = target.get(file);

	if (existing) {
		return existing;
	}

	const created: FileCoverage = {
		file,
		lines: new Map(),
		functions: new Map(),
		branches: new Map()
	};

	target.set(file, created);

	return created;
}

function mergeLine(file: FileCoverage, line: number, hits: number): void {
	file.lines.set(line, Math.max(file.lines.get(line) ?? 0, hits));
}

function mergeFunction(file: FileCoverage, line: number, name: string, hits: number): void {
	const key = `${line}:${name}`;
	const existing = file.functions.get(key);

	file.functions.set(key, {
		line,
		name,
		hits: Math.max(existing?.hits ?? 0, hits)
	});
}

function mergeBranch(file: FileCoverage, line: number, block: string, branch: string, hits: number | null): void {
	const key = `${line}:${block}:${branch}`;
	const existing = file.branches.get(key);
	const mergedHits = existing?.hits === null ? hits : hits === null ? (existing?.hits ?? null) : Math.max(existing?.hits ?? 0, hits);

	file.branches.set(key, {
		line,
		block,
		branch,
		hits: mergedHits
	});
}

function createFileReport(file: FileCoverage, changedLines?: ReadonlySet<number>): FileCoverageReport | null {
	const lines = [...file.lines.entries()].filter(([line]) => !changedLines || changedLines.has(line));
	const functions = [...file.functions.values()].filter(({ line }) => !changedLines || changedLines.has(line));
	const branches = [...file.branches.values()].filter(({ line }) => !changedLines || changedLines.has(line));

	if (changedLines && lines.length === 0 && functions.length === 0 && branches.length === 0) {
		return null;
	}

	const lineMetric = metric(lines.filter(([, hits]) => hits > 0).length, lines.length);
	const functionMetric = metric(functions.filter(({ hits }) => hits > 0).length, functions.length);
	const branchMetric = metric(branches.filter(({ hits }) => (hits ?? 0) > 0).length, branches.length);

	return {
		file: file.file,
		coverage: combineCoverage(lineMetric, branchMetric),
		lines: lineMetric,
		functions: functionMetric,
		branches: branchMetric,
		uncoveredLines: lines.filter(([, hits]) => hits === 0).map(([line]) => line)
	};
}

function metric(covered: number, total: number): MetricSummary {
	return {
		covered,
		total,
		percent: total === 0 ? null : (covered / total) * 100
	};
}

function mergeMetrics(metrics: MetricSummary[]): MetricSummary {
	const covered = metrics.reduce((sum, current) => sum + current.covered, 0);
	const total = metrics.reduce((sum, current) => sum + current.total, 0);

	return metric(covered, total);
}

function combineCoverage(lines: MetricSummary, branches: MetricSummary): MetricSummary {
	return metric(lines.covered + branches.covered, lines.total + branches.total);
}

function serializeLcov(coverage: Map<string, FileCoverage>): string {
	const records = [...coverage.values()]
		.sort((left, right) => left.file.localeCompare(right.file))
		.map((file) => {
			const lines = ['TN:', `SF:${file.file}`];

			for (const fn of [...file.functions.values()].sort(
				(left, right) => left.line - right.line || left.name.localeCompare(right.name)
			)) {
				lines.push(`FN:${fn.line},${fn.name}`);
			}

			for (const fn of [...file.functions.values()].sort(
				(left, right) => left.line - right.line || left.name.localeCompare(right.name)
			)) {
				lines.push(`FNDA:${fn.hits},${fn.name}`);
			}

			for (const branch of [...file.branches.values()].sort((left, right) => left.line - right.line)) {
				lines.push(`BRDA:${branch.line},${branch.block},${branch.branch},${branch.hits ?? '-'}`);
			}

			for (const [line, hits] of [...file.lines.entries()].sort(([left], [right]) => left - right)) {
				lines.push(`DA:${line},${hits}`);
			}

			lines.push('end_of_record');

			return lines.join('\n');
		});

	return `${records.join('\n')}\n`;
}

async function loadCoverageExclusions(): Promise<RegExp[]> {
	const properties = await readFile(resolve(process.cwd(), 'sonar-project.properties'), 'utf8');
	const value = readMultilineProperty(properties, 'sonar.coverage.exclusions');

	return value
		.split(',')
		.map((pattern) => pattern.trim())
		.filter(Boolean)
		.map(globToRegExp);
}

function readMultilineProperty(content: string, property: string): string {
	const lines = content.split(/\r?\n/);
	const start = lines.findIndex((line) => line.trimStart().startsWith(`${property}=`));

	if (start < 0) {
		return '';
	}

	const values: string[] = [];
	let index = start;
	let line = lines[index].trim();
	line = line.slice(line.indexOf('=') + 1);

	while (true) {
		const continued = line.endsWith('\\');
		values.push(continued ? line.slice(0, -1) : line);

		if (!continued) {
			break;
		}

		index++;
		line = lines[index]?.trim() ?? '';
	}

	return values.join('');
}

function globToRegExp(pattern: string): RegExp {
	let expression = '^';

	for (let index = 0; index < pattern.length; index++) {
		const character = pattern[index];

		if (character === '*' && pattern[index + 1] === '*') {
			if (pattern[index + 2] === '/') {
				expression += '(?:.*/)?';
				index += 2;
			} else {
				expression += '.*';
				index++;
			}
		} else if (character === '*') {
			expression += '[^/]*';
		} else if (character === '?') {
			expression += '[^/]';
		} else {
			expression += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}
	}

	return new RegExp(`${expression}$`);
}

function normalizePath(source: string, reportPath: string): string {
	const normalized = source.replaceAll('\\', '/');
	const root = resolve(process.cwd()).replaceAll('\\', '/');

	if (normalized.toLowerCase().startsWith(`${root.toLowerCase()}/`)) {
		return normalized.slice(root.length + 1);
	}

	const relative = normalized.replace(/^\.\//, '');

	if (relative.startsWith('apps/') || relative.startsWith('libs/')) {
		return relative;
	}

	const projectRoot = getProjectRoot(reportPath);

	return projectRoot ? `${projectRoot}/${relative}` : relative;
}

function getProjectRoot(reportPath: string): string | undefined {
	const normalized = reportPath.replaceAll('\\', '/');
	const match = /^test-result\/(.+?)\/coverage\/lcov\.info$/.exec(normalized);

	return match?.[1];
}
