import { describe, expect, it } from 'vitest';
import { ThemeImage } from '../../src/components/theme-image.js';

describe('ThemeImage', () => {
  it('selects dark asset using picture source and follows the system by default', () => {
    const icon = new ThemeImage('icon');
    icon.setUrls('/light.svg', '/dark.svg');
    expect(icon.image.getAttribute('src')).toContain('/light.svg');
    expect(icon.element.querySelector('source')?.getAttribute('srcset')).toContain('/dark.svg');
    expect(icon.element.querySelector('source')?.media).toBe('(prefers-color-scheme: dark)');
    expect(icon.image.alt).toBe('');
    expect(icon.element.querySelector('source')?.media).toBe('(prefers-color-scheme: dark)');
  });

  it('falls back to the light URL and rejects unsafe schemes', () => {
    const icon = new ThemeImage('icon');
    icon.setUrls('/light.svg');
    expect(icon.element.querySelector('source')?.getAttribute('srcset')).toContain('/light.svg');
    icon.setUrls('javascript:alert(1)', 'data:image/svg+xml,hi');
    expect(icon.element.hidden).toBe(true);
    expect(icon.image.hasAttribute('src')).toBe(false);
  });
});
