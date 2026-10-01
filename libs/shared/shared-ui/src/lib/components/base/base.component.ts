/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { inject } from '@angular/core';

import { Logger } from '../../services/logger/logger.service';

/**
 * Base class that provides shared logging access to derived components.
 */
export abstract class BaseComponent {
	protected readonly logger = inject(Logger);
}
