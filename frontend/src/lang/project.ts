import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Projet',
    DETAILS: 'Details du projet',
    LOCATION: 'Localisation',
    STATUS: 'Statut',
    COMPLETION: 'Achèvement',
    DEVELOPER: 'Developpeur',
    UNITS: 'Unites',
    DESCRIPTION: 'Description',
    GALLERY: 'Galerie',
    PLANS: 'Plans',
    MASTER_PLAN: 'Plan directeur',
    FLOOR_PLAN: 'Plan',
    MAP: 'Carte',
    SEARCH_UNITS: 'Rechercher des unites',
    EMPTY_UNITS: 'Aucune unite pour le moment.',
    VIEW_DEVELOPER: 'Voir le developpeur',
  },
  ar: {

    HEADING: 'Project',
    DETAILS: 'Project details',
    LOCATION: 'Location',
    STATUS: 'Status',
    COMPLETION: 'Completion',
    DEVELOPER: 'Developer',
    UNITS: 'Units',
    DESCRIPTION: 'Description',
    GALLERY: 'Gallery',
    PLANS: 'Plans',
    MASTER_PLAN: 'Master plan',
    FLOOR_PLAN: 'Floor plan',
    MAP: 'Map',
    SEARCH_UNITS: 'Search units',
    EMPTY_UNITS: 'No units yet.',
    VIEW_DEVELOPER: 'View developer',
  },
  en: {
    HEADING: 'Project',
    DETAILS: 'Project details',
    LOCATION: 'Location',
    STATUS: 'Status',
    COMPLETION: 'Completion',
    DEVELOPER: 'Developer',
    UNITS: 'Units',
    DESCRIPTION: 'Description',
    GALLERY: 'Gallery',
    PLANS: 'Plans',
    MASTER_PLAN: 'Master plan',
    FLOOR_PLAN: 'Floor plan',
    MAP: 'Map',
    SEARCH_UNITS: 'Search units',
    EMPTY_UNITS: 'No units yet.',
    VIEW_DEVELOPER: 'View developer',
  },
})

langHelper.setLanguage(strings)
export { strings }

