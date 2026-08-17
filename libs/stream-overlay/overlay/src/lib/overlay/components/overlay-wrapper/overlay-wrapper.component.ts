/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { Component } from '@angular/core';

import { CameraComponent } from '../camera/camera.component';
import { CurrentPaintComponent } from '../current-paint/current-paint.component';
import { HeaderComponent } from '../header/header.component';

/**
 * The wrapper component for the stream overlay.
 *
 * This component serves as the main container for the stream overlay, providing
 * a structured layout and encapsulating the current paint display.
 */
@Component({
	selector: 'stream-overlay-obs',
	standalone: true,
	templateUrl: './overlay-wrapper.component.html',
	imports: [CurrentPaintComponent, HeaderComponent, CameraComponent],
	styleUrl: './overlay-wrapper.component.scss'
})
export class OverlayWrapperComponent {}
