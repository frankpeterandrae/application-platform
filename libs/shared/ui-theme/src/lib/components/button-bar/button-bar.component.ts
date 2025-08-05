import { Component, input } from '@angular/core';
import { ButtonConfigModel } from '../../model';
import { ButtonComponent } from '../button/button.component';

/**
 * ButtonBarComponent is a reusable button bar component with customizable properties.
 */
@Component({
	selector: 'theme-button-bar',
	imports: [ButtonComponent],
	templateUrl: './button-bar.component.html'
})
export class ButtonBarComponent {
	public buttons = input.required<ButtonConfigModel[]>();
}
