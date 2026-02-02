import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    LEADS: 'Prospects',
  },
  en: {
    LEADS: 'Leads',
  },
})

langHelper.setLanguage(strings)
export { strings }
