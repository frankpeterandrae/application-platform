/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

export class TextStream {
	#skip = false;
	public skip(): void {
		this.#skip = true;
	}
	public async reveal(text: string, cps: number, signal: AbortSignal, onFrame: (text: string) => void): Promise<void> {
		this.#skip = false;
		if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
		if (cps <= 0) {
			onFrame(text);
			return;
		}
		const graphemes =
			typeof Intl.Segmenter === 'function'
				? Array.from(new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(text), (s) => s.segment)
				: Array.from(text);
		const start = performance.now();
		let count = 0;
		const advance = async (): Promise<void> => {
			if (count >= graphemes.length || this.#skip) return;
			if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
			count = Math.min(graphemes.length, Math.max(count + 1, Math.floor(((performance.now() - start) * cps) / 1000)));
			onFrame(graphemes.slice(0, count).join(''));
			await new Promise<void>((resolve, reject) => {
				const cancel = () => {
					clearTimeout(timer);
					reject(new DOMException('Aborted', 'AbortError'));
				};
				const timer = setTimeout(() => {
					signal.removeEventListener('abort', cancel);
					resolve();
				}, 20);
				signal.addEventListener('abort', cancel, { once: true });
				if (signal.aborted) cancel();
			});
			await advance();
		};
		await advance();
		if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
		onFrame(text);
	}
}
