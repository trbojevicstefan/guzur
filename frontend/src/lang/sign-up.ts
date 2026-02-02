import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SIGN_UP_HEADING: 'Inscription',
    SIGN_UP: "S'inscrire",
    SIGN_UP_ERROR: "Une erreur s'est produite lors de l'inscription.",
    ROLE_SIGN_UP: 'Vous etes courtier, promoteur ou proprietaire?',
    ROLE_SIGN_UP_LINK: 'Creer un compte partenaire',
  },
  ar: {
    SIGN_UP_HEADING: 'إنشاء حساب',
    SIGN_UP: 'إنشاء حساب',
    SIGN_UP_ERROR: 'حدث خطأ أثناء إنشاء الحساب.',
    ROLE_SIGN_UP: 'هل أنت وسيط أو مطوّر أو مالك؟',
    ROLE_SIGN_UP_LINK: 'إنشاء حساب شريك',
  },
  en: {
    SIGN_UP_HEADING: 'Register',
    SIGN_UP: 'Register',
    SIGN_UP_ERROR: 'An error occurred during sign up.',
    ROLE_SIGN_UP: 'Are you a broker, developer, or owner?',
    ROLE_SIGN_UP_LINK: 'Create a partner account',
  },
})

langHelper.setLanguage(strings)
export { strings }

