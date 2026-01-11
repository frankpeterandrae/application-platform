import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NxWelcome } from './nx-welcome';

/**
 *
 */
@Component({
	imports: [NxWelcome, RouterModule],
	selector: 'z21-root',
	templateUrl: './app.html',
	styleUrl: './app.scss'
})
export class App {
	protected title = 'z21-ui';
}
