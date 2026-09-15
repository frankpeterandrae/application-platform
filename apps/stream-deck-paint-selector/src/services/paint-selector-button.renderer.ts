/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { PAINT_SELECTOR_HOME_SLOT, PaintSelectorButton } from '@application-platform/paint-selector';

export interface PaintSelectorButtonView {
	readonly image?: string;
}

/**
 * Creates the visual representation of paint selector buttons.
 */
export class PaintSelectorButtonRenderer {
	/**
	 * Ren
	 * @param button
	 */
	public render(button: PaintSelectorButton): PaintSelectorButtonView {
		switch (button.type) {
			case 'paint':
			case 'color':
				return {
					image: this.createColorImage(button.color, button.label)
				};

			case 'empty':
				return {
					image: this.createSolidImage('#000000', '')
				};

			default:
				return {
					image: this.createSolidImage('#151515', button.label)
				};
		}
	}

	/**
	 * Renders a button for the offline state.
	 *
	 * @param slotIndex The index of the button slot.
	 * @return The rendered button view.
	 */
	public renderOffline(slotIndex: number): PaintSelectorButtonView {
		if (slotIndex === PAINT_SELECTOR_HOME_SLOT) {
			return {
				image: this.createSolidImage('#151515', 'Home')
			};
		}

		if (slotIndex === 12) {
			return {
				image: this.createSolidImage('#5a1f1f', 'Server')
			};
		}

		if (slotIndex === 13) {
			return {
				image: this.createSolidImage('#5a1f1f', 'offline')
			};
		}

		return {
			image: this.createSolidImage('#000000', '')
		};
	}

	private createColorImage(color: `#${string}`, label: string): string {
		return this.createSolidImage(color, label);
	}

	private createSolidImage(color: `#${string}`, label: string): string {
		const [firstLine, secondLine] = this.splitLabel(label);
		const fontSize = this.getFontSize(label);
		const textColor = this.getTextColor(color);

		const text = secondLine
			? `
			<text
				x="72"
				y="64"
				text-anchor="middle"
				font-family="Segoe UI"
				font-size="${fontSize}"
				font-weight="600"
				fill="${textColor}"
			>
				${this.escapeXml(firstLine)}
			</text>

			<text
				x="72"
				y="94"
				text-anchor="middle"
				font-family="Segoe UI"
				font-size="${fontSize}"
				font-weight="600"
				fill="${textColor}"
			>
				${this.escapeXml(secondLine)}
			</text>
		`
			: `
			<text
				x="72"
				y="80"
				text-anchor="middle"
				font-family="Segoe UI"
				font-size="${fontSize}"
				font-weight="600"
				fill="${textColor}"
			>
				${this.escapeXml(firstLine)}
			</text>
		`;

		const svg = `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="144"
			height="144"
			viewBox="0 0 144 144"
		>
			<rect
				width="144"
				height="144"
				rx="12"
				fill="${color}"
			/>

			${text}
		</svg>
	`;

		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}

	private splitLabel(label: string): [string, string?] {
		if (label.length <= 12) {
			return [label];
		}

		const words = label.split(' ');
		const firstLine: string[] = [];
		const secondLine: string[] = [];

		let currentLength = 0;

		for (const word of words) {
			if (currentLength + word.length + 1 <= 12 || firstLine.length === 0) {
				firstLine.push(word);
				currentLength += word.length + 1;
			} else {
				secondLine.push(word);
			}
		}

		return [firstLine.join(' '), secondLine.length > 0 ? secondLine.join(' ') : undefined];
	}

	private getFontSize(label: string): number {
		if (label.length <= 10) {
			return 28;
		}

		if (label.length <= 16) {
			return 24;
		}

		return 20;
	}

	private escapeXml(value: string): string {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&apos;');
	}

	private getTextColor(color: `#${string}`): '#000000' | '#ffffff' {
		const { r, g, b } = this.hexToRgb(color);

		const luminance = 0.2126 * this.toLinear(r) + 0.7152 * this.toLinear(g) + 0.0722 * this.toLinear(b);

		const contrastWithBlack = (luminance + 0.05) / 0.05;
		const contrastWithWhite = 1.05 / (luminance + 0.05);

		return contrastWithBlack >= contrastWithWhite ? '#000000' : '#ffffff';
	}

	private hexToRgb(color: `#${string}`): {
		readonly r: number;
		readonly g: number;
		readonly b: number;
	} {
		const hex = color.slice(1);

		return {
			r: Number.parseInt(hex.slice(0, 2), 16) / 255,
			g: Number.parseInt(hex.slice(2, 4), 16) / 255,
			b: Number.parseInt(hex.slice(4, 6), 16) / 255
		};
	}

	private toLinear(value: number): number {
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	}
}
