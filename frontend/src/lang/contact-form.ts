import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    CONTACT_HEADING: 'Contact',
    SUBJECT: 'Objet',
    MESSAGE: 'Message',
    SEND: 'Envoyer',
    MESSAGE_SENT: 'Message envoyÃ©',
  },
  ar: {
    CONTACT_HEADING: 'تواصل معنا',
    SUBJECT: 'الموضوع',
    MESSAGE: 'الرسالة',
    SEND: 'إرسال',
    MESSAGE_SENT: 'تم إرسال الرسالة',
  },
  el: {
    CONTACT_HEADING: 'Î•Ï€Î¹ÎºÎ¿Î¹Î½Ï‰Î½Î¯Î±',
    SUBJECT: 'Î˜Î­Î¼Î±',
    MESSAGE: 'ÎœÎ®Î½Ï…Î¼Î±',
    SEND: 'Î£Ï„ÎµÎ¯Î»ÎµÏ„Îµ',
    MESSAGE_SENT: 'Î¤Î¿ Î¼Î®Î½Ï…Î¼Î± ÏƒÏ„Î¬Î»Î¸Î·ÎºÎµ'
  },
  en: {
    CONTACT_HEADING: 'Contact',
    SUBJECT: 'Subject',
    MESSAGE: 'Message',
    SEND: 'Send',
    MESSAGE_SENT: 'Message sent'
  },
})

langHelper.setLanguage(strings)
export { strings }

