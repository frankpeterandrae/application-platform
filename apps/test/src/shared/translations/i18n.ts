import { loadTranslations } from './translation-loader.js';
import { I18n } from './translation.service.js';
export const i18n = new I18n({ defaultLanguage: 'de', fallbackLanguage: 'de', loader: loadTranslations });
