/** An externally sourced image with light and dark variants. No SVG markup is injected into the DOM. */
export class ThemeImage {
  public readonly element: HTMLPictureElement;
  public readonly image: HTMLImageElement;
  readonly #darkSource: HTMLSourceElement;
  #lightUrl = '';
  #darkUrl = '';

  public constructor(className: string) {
    this.element = document.createElement('picture');
    this.element.className = className;
    this.#darkSource = document.createElement('source');
    this.image = document.createElement('img');
    this.image.alt = '';
    this.image.decoding = 'async';
    this.image.referrerPolicy = 'no-referrer';
    this.image.setAttribute('aria-hidden', 'true');
    this.image.addEventListener('error', () => { this.element.hidden = true; });
    this.element.append(this.#darkSource, this.image);
    this.element.hidden = true;
  }

  public get lightUrl(): string { return this.#lightUrl; }
  public get darkUrl(): string { return this.#darkUrl; }

  public setUrls(light: string, dark = ''): void {
    this.#lightUrl = this.#safeUrl(light);
    this.#darkUrl = this.#safeUrl(dark);
    this.#update();
  }

  #safeUrl(value: string): string {
    if (!value.trim()) return '';
    try {
      const url = new URL(value, document.baseURI);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch { return ''; }
  }

  #update(): void {
    const light = this.#lightUrl || this.#darkUrl;
    const dark = this.#darkUrl || light;
    if (!light) {
      this.image.removeAttribute('src');
      this.#darkSource.removeAttribute('srcset');
      this.element.hidden = true;
      return;
    }
    this.#darkSource.media = '(prefers-color-scheme: dark)';
    this.#darkSource.srcset = dark;
    this.image.src = light;
    this.element.hidden = false;
  }
}
