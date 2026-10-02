/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';

import { CardComponent } from './card.component';

@Component({
	imports: [CardComponent],
	template: `
		<theme-card [inverted]="inverted">
			<span class="projected-content">Projected content</span>
		</theme-card>
	`
})
class TestHostComponent {
	public inverted = false;
}

describe('CardComponent', () => {
	let fixture: ComponentFixture<TestHostComponent>;
	let component: TestHostComponent;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TestHostComponent]
		});

		fixture = TestBed.createComponent(TestHostComponent);
		component = fixture.componentInstance;
	});

	it('should render the default color scheme', () => {
		fixture.detectChanges();

		const card: HTMLElement = fixture.nativeElement.querySelector('.card-border');

		expect(card.classList).toContain('fpa-dark-text');
		expect(card.classList).toContain('fpa-bg-light-shades');
	});

	it('should render the inverted color scheme', () => {
		component.inverted = true;
		fixture.detectChanges();

		const card: HTMLElement = fixture.nativeElement.querySelector('.card-border');

		expect(card.classList).toContain('fpa-light-text');
		expect(card.classList).toContain('fpa-bg-dark-shades-s3');
	});

	it('should project content into the card', () => {
		fixture.detectChanges();

		const projectedContent: HTMLElement = fixture.nativeElement.querySelector('.projected-content');

		expect(projectedContent).not.toBeNull();
		expect(projectedContent.textContent?.trim()).toBe('Projected content');
	});
});
