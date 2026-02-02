import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    NAME: 'Nom',
    EMAIL: 'E-mail',
    PHONE: 'Telephone',
    MESSAGE: 'Message',
    PROPERTY: 'Propriete',
    LISTING_TYPE: 'Type d\'annonce',
    STATUS: 'Statut',
    ASSIGNED_TO: 'Assigne a',
    CREATED_AT: 'Cree le',
    UPDATE_STATUS: 'Modifier le statut',
    NEW_STATUS: 'Nouveau statut',
    ASSIGN_TO: 'Assigner a',
    UPDATE_SELECTION: 'Modifier la selection',
    DELETE_SELECTION: 'Supprimer la selection',
    DELETE_LEAD: 'Supprimer ce prospect ?',
    DELETE_LEADS: 'Supprimer les prospects selectionnes ?',
  },
  en: {
    NAME: 'Name',
    EMAIL: 'Email',
    PHONE: 'Phone',
    MESSAGE: 'Message',
    PROPERTY: 'Property',
    LISTING_TYPE: 'Listing type',
    STATUS: 'Status',
    ASSIGNED_TO: 'Assigned to',
    CREATED_AT: 'Created at',
    UPDATE_STATUS: 'Update status',
    NEW_STATUS: 'New status',
    ASSIGN_TO: 'Assign to',
    UPDATE_SELECTION: 'Update selection',
    DELETE_SELECTION: 'Delete selection',
    DELETE_LEAD: 'Delete this lead?',
    DELETE_LEADS: 'Delete selected leads?',
  },
})

langHelper.setLanguage(strings)
export { strings }
