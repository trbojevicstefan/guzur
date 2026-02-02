import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    UNAUTHORIZED: 'AccÃ¨s non autorisÃ©',
  },
  ar: {
    UNAUTHORIZED: 'وصول غير مصرح به',
  },
  es: {
    UNAUTHORIZED: 'Acceso no autorizado',
  },
  en: {
    UNAUTHORIZED: 'Unauthorized access',
  },
})

langHelper.setLanguage(strings)
export { strings }

