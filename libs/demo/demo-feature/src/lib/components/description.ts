/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export type Columntype = 'string' | 'code';

export type Column = {
	value: string;
	span: number;
	columntype: Columntype;
	type?: string;
	optional?: boolean;
};

export type Row = {
	columns: Column[];
};

export type Table = {
	rows: Row[];
	span?: number;
};

export type Description = {
	title: string;
	description?: string;
	usage?: string;
	language?: string;
	deprecated?: boolean;
	definition?: Table;
};
