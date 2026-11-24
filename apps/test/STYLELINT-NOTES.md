# v0.7.9 CSS corrections

Based on the errors shown by the project's pre-commit Stylelint output:

- `src/styles/chat.css`: merged repeated `:host`, `.chat`, and `.log` selectors.
- `src/styles/chat.css`: uses `color-scheme: light dark` with `light-dark()` CSS color values to avoid a second `:host` ruleset for dark mode; this targets modern browsers supporting `light-dark()`.
- `src/styles/chat-message.css`: merged repeated user `.content` declarations; moved the user `.visual` rule before the assistant avatar-fallback selectors to satisfy selector ordering.
- Formatted the affected CSS for easier reading.

## Verification
- `npm run check`: passed.
- `npm run build`: passed.
- Parsed the three source stylesheets with PostCSS: passed.
- Checked for exact duplicate CSS selector blocks with PostCSS: none found.
- `stylelint`: **not executed**, because the tool is not installed here and the npm registry cannot be reached (`EAI_AGAIN`).

Run the project's original `stylelint` command in the DRV repository to validate against its actual configuration, e.g. `npx stylelint 'src/main/web-components/guided-login/src/styles/**/*.css'` from the repository root, if that is where your Stylelint configuration applies.
