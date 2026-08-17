/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */
import { InjectionToken } from '@angular/core';

import type { DialogConfigModel } from '../../model';

// Define the DIALOG_DATA injection token
export const DIALOG_DATA = new InjectionToken<DialogConfigModel<unknown>>('DialogData');
