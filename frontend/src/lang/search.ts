import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HOME: 'Accueil',
    PROPERTIES_IN: 'Biens Ã ',
    OUR_MARKET: 'notre marchÃ©',
    SEARCH_PLACEHOLDER: 'Zone, Projet, Promoteur',
    SORT_BY: 'Trier par',
    MAP_VIEW: 'Vue carte',
    SWITCH_COMPOUNDS: 'Voir les projets',
    PROPERTIES: 'biens',
    SELECT_DATES_TO_SEARCH_RENTALS: 'SÃƒÂ©lectionnez des dates pour voir les locations.',
  },
    ar: {
    HOME: 'الرئيسية',
    PROPERTIES_IN: 'عقارات في',
    OUR_MARKET: 'سوقنا',
    SEARCH_PLACEHOLDER: 'منطقة، مشروع، مطوّر',
    SORT_BY: 'ترتيب حسب',
    MAP_VIEW: 'عرض الخريطة',
    SWITCH_COMPOUNDS: 'الانتقال إلى المشاريع',
    PROPERTIES: 'عقار',
    SELECT_DATES_TO_SEARCH_RENTALS: 'اختر التواريخ لعرض الإيجارات.',
  },
  en: {
    HOME: 'Home',
    PROPERTIES_IN: 'Properties in',
    OUR_MARKET: 'our market',
    SEARCH_PLACEHOLDER: 'Area, Compound, Developer',
    SORT_BY: 'Sort by',
    MAP_VIEW: 'Map View',
    SWITCH_COMPOUNDS: 'Switch to Compounds',
    PROPERTIES: 'properties',
    SELECT_DATES_TO_SEARCH_RENTALS: 'Select dates to search rentals.',
  },
})

langHelper.setLanguage(strings)
export { strings }

