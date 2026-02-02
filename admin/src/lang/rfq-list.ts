import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NAME: 'Nom',
    EMAIL: 'E-mail',
    PHONE: 'Téléphone',
    LOCATION: 'Localisation',
    LISTING_TYPE: 'Type de liste',
    PROPERTY_TYPE: 'Type de bien',
    BEDROOMS: 'Chambres',
    BATHROOMS: 'Salles de bain',
    BUDGET: 'Budget',
    MESSAGE: 'Message',
    STATUS: 'Statut',
    ASSIGNED_TO: 'Assigné à',
    CREATED_AT: 'Créé le',
    UPDATE_STATUS: 'Mettre à jour le statut',
    NEW_STATUS: 'Nouveau statut',
    ASSIGN_TO: 'Assigner à',
    UPDATE_SELECTION: 'Mettre à jour la sélection',
    EMPTY: 'Aucune demande RFQ.',
  },
  en: {
    NAME: 'Name',
    EMAIL: 'Email',
    PHONE: 'Phone',
    LOCATION: 'Location',
    LISTING_TYPE: 'Listing type',
    PROPERTY_TYPE: 'Property type',
    BEDROOMS: 'Bedrooms',
    BATHROOMS: 'Bathrooms',
    BUDGET: 'Budget',
    MESSAGE: 'Message',
    STATUS: 'Status',
    ASSIGNED_TO: 'Assigned to',
    CREATED_AT: 'Created at',
    UPDATE_STATUS: 'Update status',
    NEW_STATUS: 'New status',
    ASSIGN_TO: 'Assign to',
    UPDATE_SELECTION: 'Update selection',
    EMPTY: 'No RFQ requests yet.',
  },
})

langHelper.setLanguage(strings)
export { strings }
