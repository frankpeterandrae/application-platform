/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject, Injectable } from '@angular/core';
import { Nebula, NebulaNode } from '@application-platform/starmap-domain';

import { MapLayoutService } from './map-layout.service';
import { RenderedMap, SvgPoint } from './render-models';

interface NebulaSample extends SvgPoint {
	radius: number;
}

interface Segment {
	start: SvgPoint;
	end: SvgPoint;
}

interface FieldBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

/**
 * Creates a two-dimensional contour from the spatial control nodes of a nebula.
 */
@Injectable({
	providedIn: 'root'
})
export class NebulaContourService {
	private readonly layout = inject(MapLayoutService);

	private readonly cellSize = 12;
	private readonly isoLevel = 0;
	private readonly radiusScale = 0.4;

	/**
	 * Creates the SVG path representing the projected nebula contour.
	 * @param nebula The nebula to project.
	 * @param renderedMap Layout data of the current map.
	 * @returns A closed SVG path or an empty string when no contour can be created.
	 */
	public createPath(nebula: Nebula, renderedMap: RenderedMap): string {
		const samples = this.createSamples(nebula, renderedMap);

		if (samples.length === 0) {
			return '';
		}

		const bounds = this.createBounds(samples);
		const segments = this.createSegments(samples, bounds);
		const contours = this.connectSegments(segments);

		if (contours.length === 0) {
			return '';
		}

		const validContours = contours.filter((contour) => contour.length >= 3);

		if (validContours.length === 0) {
			return '';
		}

		const [firstContour, ...remainingContours] = validContours;

		if (!firstContour) {
			return '';
		}

		const outerContour = remainingContours.reduce(
			(largest, current) => (this.getContourArea(current) > this.getContourArea(largest) ? current : largest),
			firstContour
		);

		return this.createClosedPath(outerContour);
	}

	private getContourArea(points: SvgPoint[]): number {
		let area = 0;

		for (let index = 0; index < points.length; index++) {
			const current = points[index];
			const next = points[(index + 1) % points.length];

			area += current.x * next.y - next.x * current.y;
		}

		return Math.abs(area / 2);
	}

	private createSamples(nebula: Nebula, renderedMap: RenderedMap): NebulaSample[] {
		const samples = nebula.nodes.map((node) => this.createNodeSample(node, renderedMap));

		for (const connection of nebula.connections) {
			const from = nebula.nodes.find((node) => node.id === connection.from);

			const to = nebula.nodes.find((node) => node.id === connection.to);

			if (!from || !to) {
				continue;
			}

			samples.push(...this.createConnectionSamples(from, to, renderedMap));
		}

		return samples;
	}

	private createNodeSample(node: NebulaNode, renderedMap: RenderedMap): NebulaSample {
		const position = this.layout.getPosition(node.position, renderedMap.bounds);

		return {
			...position,
			radius: this.getRadius(node.radius)
		};
	}
	private getRadius(radius: number): number {
		return radius * this.layout.gridSize * this.radiusScale;
	}
	private createConnectionSamples(from: NebulaNode, to: NebulaNode, renderedMap: RenderedMap): NebulaSample[] {
		const start = this.layout.getPosition(from.position, renderedMap.bounds);

		const end = this.layout.getPosition(to.position, renderedMap.bounds);

		const fromRadius = this.getRadius(from.radius);
		const toRadius = this.getRadius(to.radius);

		const distance = Math.hypot(end.x - start.x, end.y - start.y);

		const sampleDistance = Math.max(Math.min(fromRadius, toRadius) * 0.5, this.layout.gridSize * 0.1);

		const steps = Math.max(2, Math.ceil(distance / sampleDistance));

		const samples: NebulaSample[] = [];

		for (let index = 1; index < steps; index++) {
			const t = index / steps;

			samples.push({
				x: start.x + (end.x - start.x) * t,
				y: start.y + (end.y - start.y) * t,
				radius: fromRadius + (toRadius - fromRadius) * t
			});
		}

		return samples;
	}

	private createBounds(samples: NebulaSample[]): FieldBounds {
		return {
			minX: Math.min(...samples.map((sample) => sample.x - sample.radius)) - this.cellSize,

			maxX: Math.max(...samples.map((sample) => sample.x + sample.radius)) + this.cellSize,

			minY: Math.min(...samples.map((sample) => sample.y - sample.radius)) - this.cellSize,

			maxY: Math.max(...samples.map((sample) => sample.y + sample.radius)) + this.cellSize
		};
	}

	private getFieldValue(x: number, y: number, samples: NebulaSample[]): number {
		let distance = Number.POSITIVE_INFINITY;

		for (const sample of samples) {
			const dx = x - sample.x;
			const dy = y - sample.y;

			const sampleDistance = Math.hypot(dx, dy) - sample.radius;

			distance = Math.min(distance, sampleDistance);
		}

		return distance;
	}

	private createSegments(samples: NebulaSample[], bounds: FieldBounds): Segment[] {
		const segments: Segment[] = [];

		for (let y = bounds.minY; y < bounds.maxY; y += this.cellSize) {
			for (let x = bounds.minX; x < bounds.maxX; x += this.cellSize) {
				segments.push(...this.createCellSegments(x, y, samples));
			}
		}

		return segments;
	}

	private createCellSegments(x: number, y: number, samples: NebulaSample[]): Segment[] {
		const topLeft = {
			x,
			y
		};

		const topRight = {
			x: x + this.cellSize,
			y
		};

		const bottomRight = {
			x: x + this.cellSize,
			y: y + this.cellSize
		};

		const bottomLeft = {
			x,
			y: y + this.cellSize
		};

		const values = [
			this.getFieldValue(topLeft.x, topLeft.y, samples),
			this.getFieldValue(topRight.x, topRight.y, samples),
			this.getFieldValue(bottomRight.x, bottomRight.y, samples),
			this.getFieldValue(bottomLeft.x, bottomLeft.y, samples)
		];

		let state = 0;

		if (values[0] <= this.isoLevel) {
			state |= 1;
		}

		if (values[1] <= this.isoLevel) {
			state |= 2;
		}

		if (values[2] <= this.isoLevel) {
			state |= 4;
		}

		if (values[3] <= this.isoLevel) {
			state |= 8;
		}

		if (state === 0 || state === 15) {
			return [];
		}

		const top = this.interpolate(topLeft, topRight, values[0], values[1]);

		const right = this.interpolate(topRight, bottomRight, values[1], values[2]);

		const bottom = this.interpolate(bottomLeft, bottomRight, values[3], values[2]);

		const left = this.interpolate(topLeft, bottomLeft, values[0], values[3]);

		switch (state) {
			case 1:
			case 14:
				return [{ start: left, end: top }];

			case 2:
			case 13:
				return [{ start: top, end: right }];

			case 3:
			case 12:
				return [{ start: left, end: right }];

			case 4:
			case 11:
				return [{ start: right, end: bottom }];

			case 5:
				return [
					{ start: left, end: top },
					{ start: right, end: bottom }
				];

			case 6:
			case 9:
				return [{ start: top, end: bottom }];

			case 7:
			case 8:
				return [{ start: left, end: bottom }];

			case 10:
				return [
					{ start: top, end: right },
					{ start: bottom, end: left }
				];

			default:
				return [];
		}
	}

	private interpolate(from: SvgPoint, to: SvgPoint, fromValue: number, toValue: number): SvgPoint {
		const difference = toValue - fromValue;

		if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || Math.abs(difference) < Number.EPSILON) {
			return {
				x: (from.x + to.x) / 2,
				y: (from.y + to.y) / 2
			};
		}

		const t = (this.isoLevel - fromValue) / difference;

		return {
			x: from.x + (to.x - from.x) * t,
			y: from.y + (to.y - from.y) * t
		};
	}

	private connectSegments(segments: Segment[]): SvgPoint[][] {
		const remaining = [...segments];
		const contours: SvgPoint[][] = [];

		while (remaining.length > 0) {
			const first = remaining.shift();

			if (!first) {
				break;
			}

			const contour = [first.start, first.end];

			let current = first.end;

			while (remaining.length > 0) {
				const index = remaining.findIndex(
					(segment) => this.isSamePoint(segment.start, current) || this.isSamePoint(segment.end, current)
				);

				if (index === -1) {
					break;
				}

				const segment = remaining.splice(index, 1)[0];

				const next = this.isSamePoint(segment.start, current) ? segment.end : segment.start;

				if (this.isSamePoint(next, contour[0])) {
					break;
				}

				contour.push(next);
				current = next;
			}

			contours.push(contour);
		}

		return contours;
	}

	private isSamePoint(first: SvgPoint, second: SvgPoint): boolean {
		const tolerance = 0.01;

		return Math.abs(first.x - second.x) < tolerance && Math.abs(first.y - second.y) < tolerance;
	}

	private createClosedPath(points: SvgPoint[]): string {
		const commands = [`M ${points[0].x},${points[0].y}`];

		for (let index = 1; index < points.length; index++) {
			commands.push(`L ${points[index].x},${points[index].y}`);
		}

		commands.push('Z');

		return commands.join(' ');
	}
}
