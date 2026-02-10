/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { AfterViewInit, Component, ElementRef, input, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace';

Prism.plugins['NormalizeWhitespace'].setDefaults({
	'left-trim': true,
	'right-trim': true
});

/**
 * PrismComponent is a standalone Angular component that uses the Prism.js library to highlight code syntax.
 * It accepts 'code' and 'language' as input properties and highlights the code accordingly.
 * The component implements AfterViewInit to perform syntax highlighting after the view is initialized and OnChanges to update the highlighting when the input code changes.
 */
@Component({
	selector: 'demo-theme-prism',
	templateUrl: './prism.component.html',
	imports: []
})
export class PrismComponent implements AfterViewInit, OnChanges {
	public readonly codeRef = viewChild<ElementRef>('codeEle');
	public readonly code = input<string>();
	public readonly language = input<string>();

	ngAfterViewInit(): void {
		const codeRef = this.codeRef();
		if (!codeRef?.nativeElement) {
			return;
		}
		Prism.highlightElement(codeRef.nativeElement);
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['code']) {
			const codeRef = this.codeRef();
			if (codeRef?.nativeElement) {
				codeRef.nativeElement.textContent = this.code();
				Prism.highlightElement(codeRef.nativeElement);
			}
		}
	}
}
