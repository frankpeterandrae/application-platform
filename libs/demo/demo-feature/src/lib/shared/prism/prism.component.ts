/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AfterViewInit, Component, ElementRef, input, OnChanges, viewChild } from '@angular/core';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';
import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace';

/** Renders syntax-highlighted code using Prism.js. */
@Component({
	selector: 'demo-theme-prism',
	templateUrl: './prism.component.html',
	imports: []
})
export class PrismComponent implements AfterViewInit, OnChanges {
	private readonly codeRef = viewChild<ElementRef<HTMLElement>>('codeEle');

	public readonly code = input<string>('');
	public readonly language = input<string>('html');

	ngAfterViewInit(): void {
		this.highlightCode();
	}

	ngOnChanges(): void {
		this.highlightCode();
	}

	private highlightCode(): void {
		const codeRef = this.codeRef();

		if (!codeRef?.nativeElement) {
			return;
		}

		const element = codeRef.nativeElement;

		// Set text before highlighting so HTML snippets are displayed as code.
		element.textContent = this.code();
		element.className = `language-${this.language()}`;

		Prism.highlightElement(element);
	}
}
