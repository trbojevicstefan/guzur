import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NEW_BOOKING: 'Nouvelle rÃ©servation',
  },
  ar: {

    NEW_BOOKING: 'New Booking',
  },
  en: {
    NEW_BOOKING: 'New Booking',
  },
})

langHelper.setLanguage(strings)
export { strings }

