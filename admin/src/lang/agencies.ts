import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_AGENCY: 'Nouveau courtier',
    AGENCY: 'courtier',
    AGENCIES: 'courtiers',
  },
  en: {
    NEW_AGENCY: 'New broker',
    AGENCY: 'broker',
    AGENCIES: 'brokers',
  },
})

langHelper.setLanguage(strings)
export { strings }
