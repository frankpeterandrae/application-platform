/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { AfterViewInit, OnDestroy } from '@angular/core';
import { Component, computed, ElementRef, input, DOCUMENT, inject } from '@angular/core';
import type { SafeUrl } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';

/**
 *
 */
@Component({
	selector: 'theme-image-loader',
	imports: [],
	templateUrl: './image-loader.component.html',
	styleUrl: './image-loader.component.scss'
})
export class ImageLoaderComponent implements AfterViewInit, OnDestroy {
	private readonly elementRef = inject(ElementRef);
	private readonly sanitizer = inject(DomSanitizer);
	private readonly document = inject<Document>(DOCUMENT);

	/**
	 * The source URL of the image.
	 */
	public src = input.required<string>();

	/**
	 * The alt text for the image.
	 */
	public alt = input.required<string>();

	/**
	 * The current image source, which can be a string or a SafeUrl.
	 */
	public imageSrc: string | SafeUrl = ''; // Current image source

	/**
	 * Flag to indicate if the actual image has loaded.
	 */
	public isLoaded = false; // Flag to indicate if the actual image has loaded

	/**
	 * The sizes attribute for the image, defining different image sizes for different viewport widths.
	 */
	public imageSizes = `
     (max-width: 600px) 480px,
     (max-width: 900px) 768px,
     1200px
   `.trim();

	/**
	 * IntersectionObserver instance to observe when the image comes into view.
	 */
	private observer!: IntersectionObserver; // IntersectionObserver instance

	/**
	 * Computed property to generate the srcset attribute for the image.
	 * It creates a list of image URLs with different widths based on the standardWidths array.
	 */
	public imageSrcSet = computed(() => {
		const src = this.src();
		if (src) {
			const url = new URL(src, this.document.location.origin);
			const pathname = url.pathname;
			const extensionIndex = pathname.lastIndexOf('.');
			if (extensionIndex === -1) {
				return;
			}

			const name = pathname.substring(pathname.lastIndexOf('/') + 1, extensionIndex);
			const extension = pathname.substring(extensionIndex);
			const directory = pathname.substring(0, pathname.lastIndexOf('/') + 1);

			// Generate srcset string
			const srcSetArray = this.standardWidths.map((width) => {
				const imageUrl = `${directory}${name}-${width}w${extension}`;
				return `${imageUrl} ${width}w`;
			});
			return srcSetArray.join(', ');
		}
		return '';
	});

	/**
	 * Array of standard widths for generating the srcset attribute.
	 */
	private readonly standardWidths: number[] = [480, 768, 1200];

	/**
	 * Constructor for ImageLoaderComponent.
	 * Initializes the component with the provided services and sets a placeholder image.
	 */
	constructor() {
		// Initialize with placeholder
		this.setPlaceholder();
	}

	/**
	 * Lifecycle hook that is called after the component's view has been fully initialized.
	 * Sets up an IntersectionObserver to load the image when it comes into view.
	 */
	ngAfterViewInit(): void {
		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						this.loadImage();
						this.observer.disconnect();
					}
				});
			},
			{
				rootMargin: '50px',
				threshold: 0.01
			}
		);
		this.observer.observe(this.elementRef.nativeElement);
	}

	/**
	 * Lifecycle hook that is called when the component is destroyed.
	 */
	ngOnDestroy(): void {
		this.observer.disconnect();
	}

	/**
	 * Sets the placeholder image source.
	 * If a custom placeholder is provided, it uses that; otherwise, it uses the default.
	 * The placeholder is sanitized to avoid Angular's security issues.
	 */
	private setPlaceholder(): void {
		const placeholderUrl = `
    data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#e0e0e0"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#aaa" font-size="20">Loading...</text>
      </svg>
    `)}
  `;
		this.imageSrc = this.sanitizer.bypassSecurityTrustUrl(placeholderUrl);
	}

	/**
	 * Loads the actual image by setting the image source.
	 * This triggers the loading of the image.
	 */
	private loadImage(): void {
		// Set the image source to the actual image to trigger loading
		this.isLoaded = false;
		this.imageSrc = this.src();
	}

	/**
	 * Handles the load event when the image has successfully loaded.
	 */
	public onLoad(): void {
		this.isLoaded = true;
	}

	/**
	 * Handles the error event when the image fails to load.
	 * Reverts to the placeholder image.
	 */
	public onError(): void {
		// If there's an error loading the actual image, revert to the placeholder
		this.setPlaceholder();
	}
}
