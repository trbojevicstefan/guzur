import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Contacter',
    NAME: 'Nom',
    EMAIL: 'Email',
    PHONE: 'Telephone',
    MESSAGE: 'Message',
    SEND: 'Envoyer',
    SENT: 'Demande envoyee',
  },
    ar: {
    HEADING: 'تواصل',
    NAME: 'الاسم',
    EMAIL: 'البريد الإلكتروني',
    PHONE: 'رقم الهاتف',
    MESSAGE: 'الرسالة',
    SEND: 'إرسال',
    SENT: 'تم إرسال الطلب',
  },
  en: {
    HEADING: 'Contact',
    NAME: 'Name',
    EMAIL: 'Email',
    PHONE: 'Phone',
    MESSAGE: 'Message',
    SEND: 'Send',
    SENT: 'Inquiry sent',
  },
})

langHelper.setLanguage(strings)
export { strings }


