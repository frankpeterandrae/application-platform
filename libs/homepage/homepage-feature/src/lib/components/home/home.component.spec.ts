/*
 * Copyright (c) 2024. Frank-Peter Andrä
 * All rights reserved.
 */

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { HeroComponent } from '../hero/hero.component';
import { setupTestingModule } from '../../../test-setup';
import { Meta, Title } from '@angular/platform-browser';
import Mocked = jest.Mocked;

describe('HomeComponent', () => {
	let component: HomeComponent;
	let fixture: ComponentFixture<HomeComponent>;
	let mockMeta: Mocked<Meta>;
	let mockTitle: Mocked<Title>;

	beforeEach(async () => {
		mockMeta = {
			addTag: jest.fn()
		} as unknown as jest.Mocked<Meta>;
		mockTitle = {
			setTitle: jest.fn()
		} as unknown as jest.Mocked<Title>;

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

	it('should set the title and meta description', fakeAsync(() => {
		component.ngOnInit();
		tick(100); // Simulate the delay in `translate`
		fixture.detectChanges();
		expect(mockTitle.setTitle).toHaveBeenCalledWith('feature.HomeComponent.meta.Title');
		expect(mockMeta.addTag).toHaveBeenCalledWith({ name: 'description', content: 'feature.HomeComponent.meta.Description' });
	}));
});
