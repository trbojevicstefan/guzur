import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    VIEW_ON_MAP: 'Voir sur la carte',
  },
  ar: {

    VIEW_ON_MAP: 'View on map',
  },
  en: {
    VIEW_ON_MAP: 'View on map',
  },
})

langHelper.setLanguage(strings)
export { strings }

