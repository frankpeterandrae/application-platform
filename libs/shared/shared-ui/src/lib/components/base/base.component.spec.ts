import { BaseComponent } from './base.component';
import { setupTestingModule } from '../../../test-setup';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { LOGGER_SOURCE } from '../../services/logger/logger.service';

@Component({
	providers: [{ provide: LOGGER_SOURCE, useValue: 'TestComponent' }]
})
class TestComponent extends BaseComponent {
	public someAction(): void {
		this.logger.info('action');
	}
}

describe('BaseComponent', () => {
	let component: TestComponent;
	let fixture: ComponentFixture<TestComponent>;
	let loggerSpy: jest.SpyInstance;

	beforeEach(async () => {
		await setupTestingModule({
			imports: [TestComponent]
		});

		fixture = TestBed.createComponent(TestComponent);
		component = fixture.componentInstance;
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		loggerSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
		fixture.detectChanges();
	});

	it('should forward calls to the log method of Logger when actions are performed', () => {
		component.someAction();
		expect(loggerSpy).toHaveBeenCalledWith('action');
	});
});
