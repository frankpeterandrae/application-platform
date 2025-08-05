/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { setupTestingModule } from '../../../test-setup';
import { ButtonColorDefinition } from '../../enums';
import { ButtonConfigModel } from '../../model';

import { ButtonBarComponent } from './button-bar.component';

describe('ButtonBarComponent', () => {
	let component: ButtonBarComponent;
	let fixture: ComponentFixture<ButtonBarComponent>;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [ButtonBarComponent]
		});

		const config: ButtonConfigModel[] = [
			{
				buttonText: 'Button 1',
				callback: () => console.log('Button 1 clicked'),
				color: ButtonColorDefinition.DANGER
			}
		];
		fixture = TestBed.createComponent(ButtonBarComponent);
		component = fixture.componentInstance;
		fixture.componentRef.setInput('buttons', config);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
