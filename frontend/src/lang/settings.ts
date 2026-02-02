import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SETTINGS_UPDATED: 'ParamÃ¨tres modifiÃ©s avec succÃ¨s.',
    NETWORK_SETTINGS: 'ParamÃ¨tres RÃ©seau',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Activer les notifications par email',
  },
  ar: {

    SETTINGS_UPDATED: 'Settings updated successfully.',
    NETWORK_SETTINGS: 'Network settings',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Enable email notifications',
  },
  en: {
    SETTINGS_UPDATED: 'Settings updated successfully.',
    NETWORK_SETTINGS: 'Network settings',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Enable email notifications',
  },
})

langHelper.setLanguage(strings)
export { strings }

