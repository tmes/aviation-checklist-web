// Translation API endpoints

import { api } from './client';

export interface Language {
  languageCode: string;
  languageName: string;
  nativeName: string;
}

export interface LanguagesResponse {
  data: Language[];
}

/**
 * Get all supported languages
 */
export const getLanguages = async (): Promise<Language[]> => {
  const response = await api.get<LanguagesResponse>('/api/translations/languages');
  return response.data;
};

/**
 * Get translations for a specific language
 */
export const getTranslations = async (languageCode: string): Promise<Record<string, string>> => {
  return api.get<Record<string, string>>(`/api/translations/${languageCode}`);
};
