import LocalizedStrings from 'localized-strings'
import env from '@/config/env.config'
import * as UserService from '@/services/UserService'

/**
 * Get current language.
 *
 * @returns {string}
 */
export const getLanguage = () => {
  let language = UserService.getQueryLanguage() ?? ''

  if (language === '' || !env.LANGUAGES.includes(language)) {
    language = UserService.getLanguage()
  }

  return language
}

/**
 * Set LocalizedStrings language.
 *
 * @param {LocalizedStrings} strings
 * @param {?string} [language]
 */
export const setLanguage = (strings: LocalizedStrings, language?: string) => {
  const lang = language || getLanguage()
  const availableLanguages = (strings as unknown as { getAvailableLanguages?: () => string[] }).getAvailableLanguages?.() || []
  const resolvedLanguage = availableLanguages.includes(lang)
    ? lang
    : (availableLanguages.includes('en') ? 'en' : availableLanguages[0] || env.DEFAULT_LANGUAGE)
  strings.setLanguage(resolvedLanguage)
}
