import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Demandes RFQ',
    EMPTY: 'Aucune demande.',
    NAME: 'Nom',
    EMAIL: 'Email',
    PHONE: 'Telephone',
    LOCATION: 'Localisation',
    LISTING_TYPE: 'Type',
    PROPERTY_TYPE: 'Bien',
    BUDGET: 'Budget',
    STATUS: 'Statut',
    UPDATED: 'Mis a jour',
  },
  en: {
    HEADING: 'RFQ Requests',
    EMPTY: 'No requests yet.',
    NAME: 'Name',
    EMAIL: 'Email',
    PHONE: 'Phone',
    LOCATION: 'Location',
    LISTING_TYPE: 'Listing type',
    PROPERTY_TYPE: 'Property type',
    BUDGET: 'Budget',
    STATUS: 'Status',
    UPDATED: 'Updated',
  },
})

langHelper.setLanguage(strings)
export { strings }
