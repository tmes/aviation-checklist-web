// i18n Configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // React already escapes
    },

    backend: {
      loadPath: `${API_URL}/api/translations/{{lng}}`,
      requestOptions: {
        cache: 'default',
      },
    },

    // Cache translations in localStorage
    react: {
      useSuspense: false,
    },

    // Load these namespaces by default
    ns: ['common', 'auth', 'aircraft', 'checklists', 'errors'],
    defaultNS: 'common',
  });

export default i18n;

// Type-safe translation keys
export type TranslationKey =
  | 'auth.login'
  | 'auth.register'
  | 'auth.logout'
  | 'auth.email'
  | 'auth.password'
  | 'auth.firstName'
  | 'auth.lastName'
  | 'auth.emailNotVerified'
  | 'auth.resendVerification'
  | 'aircraft.title'
  | 'aircraft.create'
  | 'aircraft.registration'
  | 'checklists.title'
  | 'checklists.create'
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.loading'
  | 'common.error'
  | 'errors.network'
  | 'errors.unauthorized';
