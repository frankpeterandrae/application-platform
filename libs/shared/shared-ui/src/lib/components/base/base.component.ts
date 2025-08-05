/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject } from '@angular/core';

import { Logger } from '../../services/logger/logger.service';

/**
 * Base class for all components to provide common functionality.
 */
export abstract class BaseComponent {
	protected readonly logger = inject(Logger);
}
