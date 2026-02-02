import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    OWNERS: 'Proprietaires',
    OWNER: 'Proprietaire',
  },
  en: {
    OWNERS: 'Owners',
    OWNER: 'Owner',
  },
})

langHelper.setLanguage(strings)
export { strings }
