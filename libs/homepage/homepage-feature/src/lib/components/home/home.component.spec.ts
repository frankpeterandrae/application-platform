/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import type { Mocked } from '@application-platform/testing';
import { createMock } from '@application-platform/testing';
import { vi } from 'vitest';

import { setupTestingModule } from '../../../test-setup';
import { HeroComponent } from '../hero/hero.component';

import { HomeComponent } from './home.component';

// use `any` for mocked browser services

describe('HomeComponent', () => {
	let component: HomeComponent;
	let fixture: ComponentFixture<HomeComponent>;
	let mockMeta: Mocked<Meta>;
	let mockTitle: Mocked<Title>;

	beforeEach(async () => {
		mockMeta = createMock<Meta>({ addTag: vi.fn() });
		mockTitle = createMock<Title>({ setTitle: vi.fn() });

		await setupTestingModule({
			imports: [HomeComponent, HeroComponent],
			providers: [
				{ provide: Meta, useValue: mockMeta },
				{ provide: Title, useValue: mockTitle }
			]
		});

		fixture = TestBed.createComponent(HomeComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should set the title and meta description', async () => {
		component.ngOnInit();
		// wait for translation simulation
		await new Promise((r) => setTimeout(r, 100));
		fixture.detectChanges();
		expect(mockTitle.setTitle).toHaveBeenCalledWith('HomeComponent.meta.Title');
		expect(mockMeta.addTag).toHaveBeenCalledWith({ name: 'description', content: 'HomeComponent.meta.Description' });
	});
});
