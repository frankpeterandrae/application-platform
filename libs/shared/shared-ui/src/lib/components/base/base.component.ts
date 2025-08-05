import { inject } from '@angular/core';
import { Logger } from '../../services/logger/logger.service';

/**
 * TODO.
 */
export abstract class BaseComponent {
	protected readonly logger = inject(Logger);
}
