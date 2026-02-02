import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SELECT_LOCATION: 'Choisir cette destination',
    VIEW_PROPERTY: 'Voir la propriÃ©tÃ©',
    STREET: 'Rue',
    SATELLITE: 'Satellite',
  },
  ar: {

    SELECT_LOCATION: 'Select Destination',
    VIEW_PROPERTY: 'View Property',
    STREET: 'Street',
    SATELLITE: 'Satellite',
  },
  en: {
    SELECT_LOCATION: 'Select Destination',
    VIEW_PROPERTY: 'View Property',
    STREET: 'Street',
    SATELLITE: 'Satellite',
  },
})

langHelper.setLanguage(strings)
export { strings }

