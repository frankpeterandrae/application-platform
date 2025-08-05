import { ButtonColorDefinition } from '../enums/button-color-definition';

export interface ButtonConfigModel {
	buttonText: string;

	/** Icon to be displayed on the button. */
	icon?: string;

	/** Color definition for the button. */
	color: ButtonColorDefinition | undefined;

	/** Flag to determine if the icon should be displayed at the end. */
	iconEnd?: boolean;

	/** Flag to disable the button. */
	disabled?: boolean;

	/** Type of the button (submit, reset, button). */
	type?: 'submit' | 'reset' | 'button';

	/** Callback to run when the button is clicked. */
	callback: () => void;
}
