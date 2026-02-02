import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Onboarding',
    SUBHEADING: 'Complete your profile to access your dashboard.',
    COMPANY: 'Societe',
    LICENSE_ID: 'Numero de licence',
    SERVICE_AREAS: 'Zones de service',
    WEBSITE: 'Site web',
    SAVE: 'Save',
    COMPLETE: 'Onboarding completed.',
  },
    ar: {
    HEADING: 'الإعداد',
    SUBHEADING: 'أكمل ملفك الشخصي للوصول إلى لوحة التحكم.',
    COMPANY: 'الشركة',
    LICENSE_ID: 'رقم الترخيص',
    SERVICE_AREAS: 'مناطق الخدمة',
    WEBSITE: 'الموقع الإلكتروني',
    SAVE: 'حفظ',
    COMPLETE: 'تم إكمال الإعداد.',
  },
  en: {
    HEADING: 'Onboarding',
    SUBHEADING: 'Complete your profile to access your dashboard.',
    COMPANY: 'Company',
    LICENSE_ID: 'License ID',
    SERVICE_AREAS: 'Service areas',
    WEBSITE: 'Website',
    SAVE: 'Save',
    COMPLETE: 'Onboarding completed.',
  },
})

langHelper.setLanguage(strings)
export { strings }


