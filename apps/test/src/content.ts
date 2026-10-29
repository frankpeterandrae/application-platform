/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

/** Allowlisted dialog content (NOT arbitrary HTML). Build DOM without innerHTML. */
export function safeFragment(source: string): DocumentFragment {
	const parsed = new DOMParser().parseFromString(source, 'text/html');
	const fragment = document.createDocumentFragment();
	function walk(from: Node, to: Node): void {
		for (const child of Array.from(from.childNodes)) {
			if (child.nodeType === Node.TEXT_NODE) {
				to.appendChild(document.createTextNode(child.textContent ?? ''));
			} else if (child instanceof Element) {
				const tag = child.localName.toLowerCase();
				if (tag === 'br') {
					to.appendChild(document.createElement('br'));
					continue;
				}
				if (tag === 'a' || tag === 'drv-ui-link') {
					const href = child.getAttribute('href') ?? '';
					let url: URL | undefined;
					try {
						url = new URL(href, document.baseURI);
					} catch {
						/* invalid */
					}
					if (url && ['https:', 'http:', 'mailto:'].includes(url.protocol)) {
						const link = document.createElement('a');
						link.href = url.href;
						link.textContent = child.getAttribute('value') ?? child.textContent ?? url.href;
						if (url.protocol !== 'mailto:') {
							link.target = '_blank';
							link.rel = 'noopener noreferrer';
						}
						to.appendChild(link);
					} else {
						walk(child, to);
					}
				} else if (['b', 'strong', 'i', 'em'].includes(tag)) {
					const e = document.createElement(tag);
					walk(child, e);
					to.appendChild(e);
				} else if (!['script', 'style', 'iframe', 'svg', 'template'].includes(tag)) {
					walk(child, to);
				}
			}
		}
	}
	walk(parsed.body, fragment);
	return fragment;
}

export function plainText(source: string): string {
	const host = document.createElement('div');
	host.append(safeFragment(source));
	return host.textContent ?? '';
}
