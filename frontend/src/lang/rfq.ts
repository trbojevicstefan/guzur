import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Demande de recherche',
    SUBHEADING: 'Dites-nous ce que vous cherchez et nous vous mettrons en relation.',
    LISTING_TYPE: 'Type de recherche',
    PROPERTY_TYPE: 'Type de bien',
    BEDROOMS: 'Chambres',
    BATHROOMS: 'Salles de bain',
    BUDGET: 'Budget',
    MESSAGE: 'Message',
    SUBMIT: 'Envoyer la demande',
    SUCCESS: 'Votre demande a bien Ã©tÃ© envoyÃ©e.',
  },
  ar: {

    HEADING: 'Request a Home',
    SUBHEADING: 'Tell us what you need and we will connect you to the right listings.',
    LISTING_TYPE: 'Looking to',
    PROPERTY_TYPE: 'Property type',
    BEDROOMS: 'Bedrooms',
    BATHROOMS: 'Bathrooms',
    BUDGET: 'Budget',
    MESSAGE: 'Message',
    SUBMIT: 'Send request',
    SUCCESS: 'Your request has been submitted.',
  },
  en: {
    HEADING: 'Request a Home',
    SUBHEADING: 'Tell us what you need and we will connect you to the right listings.',
    LISTING_TYPE: 'Looking to',
    PROPERTY_TYPE: 'Property type',
    BEDROOMS: 'Bedrooms',
    BATHROOMS: 'Bathrooms',
    BUDGET: 'Budget',
    MESSAGE: 'Message',
    SUBMIT: 'Send request',
    SUCCESS: 'Your request has been submitted.',
  },
})

langHelper.setLanguage(strings)
export { strings }

