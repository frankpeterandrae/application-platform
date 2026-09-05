/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/**
 * Configuration for one database snapshot table.
 */
export interface DatabaseSnapshotTableConfig {
	readonly export?: false;
	readonly import?: false;
	readonly groupBy?: string;
	readonly orderBy?: readonly string[];
}

/**
 * Configuration for importing and exporting a database snapshot.
 */
export interface DatabaseSnapshotConfig {
	readonly tablePrefix: string;
	readonly tables?: Readonly<Record<string, DatabaseSnapshotTableConfig>>;
}

export type DatabaseSnapshotRow = Record<string, unknown>;
