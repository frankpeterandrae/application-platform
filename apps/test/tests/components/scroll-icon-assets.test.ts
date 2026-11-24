import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const icons = ['arrow-down-light.svg', 'arrow-down-dark.svg'];

describe('Scroll-to-bottom SVG assets', () => {
  it.each(icons)('%s contains both button circle and centered arrow', filename => {
    const assetUrl = new URL(`../../src/assets/icons/${filename}`, import.meta.url);
    const svg = readFileSync(assetUrl, 'utf8');
    expect(svg).toContain('viewBox="0 0 44 44"');
    expect(svg).toMatch(/<circle\b[^>]*cx="22"[^>]*cy="22"/);
    expect(svg).toContain('M22 14v16m-7-7 7 7 7-7');
  });
});
