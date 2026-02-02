import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Inscription partenaire',
    CHOOSE_ROLE: 'Choisissez votre role',
    BROKER: 'Courtier',
    DEVELOPER: 'Promoteur',
    OWNER: 'Proprietaire',
    SIGN_UP_AS: 'Creer un compte',
  },
  ar: {
    HEADING: 'تسجيل الشركاء',
    CHOOSE_ROLE: 'اختر نوع الحساب',
    BROKER: 'وسيط',
    DEVELOPER: 'مطوّر',
    OWNER: 'مالك',
    SIGN_UP_AS: 'إنشاء الحساب',
  },
  en: {
    HEADING: 'Partner registration',
    CHOOSE_ROLE: 'Choose your role',
    BROKER: 'Broker',
    DEVELOPER: 'Developer',
    OWNER: 'Owner',
    SIGN_UP_AS: 'Create account',
  },
})

langHelper.setLanguage(strings)
export { strings }

