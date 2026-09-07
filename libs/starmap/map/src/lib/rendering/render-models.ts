/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { MapBounds } from '@application-platform/starmap-domain';

export interface SvgPoint {
	x: number;
	y: number;
}

export interface StarRenderData {
	size: number;
	colors: [string, string, string];
}

export interface StarOffset {
	x: number;
	y: number;
}

export interface RenderedStar {
	index: number;
	spectralType: string;
	renderData: StarRenderData;
	offset: StarOffset;
	gradientA: string;
	gradientB: string;
	gradientC: string;
}

export interface StarGradientDefinition {
	spectralType: string;
	size: number;
	colors: [string, string, string];
	gradientA: string;
	gradientB: string;
	gradientC: string;
}

export interface RenderedJumpLink {
	id: string;
	start: SvgPoint;
	end: SvgPoint;
	distance: number;
	color: string;
	strokeWidth: number;
	dashArray?: string;
	labelPosition: SvgPoint;
}

export interface RenderedNebula {
	id: string;
	name: string;
	path: string;
	fill: string;
	fillOpacity: number;
	stroke: string;
	strokeOpacity: number;
	strokeWidth: number;
}

export interface GridLine {
	position: number;
	coordinate?: number;
}

export interface RenderedMap {
	bounds: MapBounds;
	width: number;
	height: number;
	xGridLines: number[];
	yGridLines: number[];
}

export interface RenderedSystem {
	position: SvgPoint;
	starOffset: StarOffset;
	labelPosition: SvgPoint;
	zPosition: SvgPoint;
}
