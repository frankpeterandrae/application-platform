import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonBarComponent } from './button-bar.component';
import { ButtonColorDefinition } from '../dialog/dialog.component';

describe('ButtonBarComponent', () => {
	let component: ButtonBarComponent;
	let fixture: ComponentFixture<ButtonBarComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ButtonBarComponent]
		}).compileComponents();

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
