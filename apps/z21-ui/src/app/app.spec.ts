import { TestBed } from '@angular/core/testing';

import { NxWelcome } from './nx-welcome';

describe('NxWelcome', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [NxWelcome]
		}).compileComponents();
	});

	it('should render title', async () => {
		const fixture = TestBed.createComponent(NxWelcome);
		await fixture.whenStable();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector('h1')?.textContent).toContain('Welcome z21-ui');
	});
});
