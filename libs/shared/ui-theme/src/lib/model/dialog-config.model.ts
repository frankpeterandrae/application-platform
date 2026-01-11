/*
 * Copyright (c) 2024-2026. Frank-Peter Andrä
 * All rights reserved.
 */

interface DialogSettings {
	title?: string;
	onClose?: () => void;
	onAccept?: () => void;
	onDecline?: () => void;
}

export interface DialogConfigModel<T> {
	componentData: T | undefined;
	settings: DialogSettings | undefined;
}
