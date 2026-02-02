import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Projets',
    SEARCH: 'Recherche',
    LOCATION: 'Localisation',
    STATUS: 'Statut',
    ALL_STATUSES: 'Tous les statuts',
    EMPTY: 'Aucun projet.',
    NAME: 'Nom',
    DEVELOPER: 'Developpeur',
    UNITS: 'Unites',
    UPDATED: 'Mis a jour',
    BROWSE_BY_LOCATION: 'Parcourir par localisation',
    CLEAR_LOCATION: 'Effacer la localisation',
    FILTERED_BY_LOCATION: 'Filtres par localisation',
  },
  ar: {

    HEADING: 'Projects',
    SEARCH: 'Search',
    LOCATION: 'Location',
    STATUS: 'Status',
    ALL_STATUSES: 'All statuses',
    EMPTY: 'No projects yet.',
    NAME: 'Name',
    DEVELOPER: 'Developer',
    UNITS: 'Units',
    UPDATED: 'Updated',
    BROWSE_BY_LOCATION: 'Browse by location',
    CLEAR_LOCATION: 'Clear location',
    FILTERED_BY_LOCATION: 'Filtered by location',
  },
  en: {
    HEADING: 'Projects',
    SEARCH: 'Search',
    LOCATION: 'Location',
    STATUS: 'Status',
    ALL_STATUSES: 'All statuses',
    EMPTY: 'No projects yet.',
    NAME: 'Name',
    DEVELOPER: 'Developer',
    UNITS: 'Units',
    UPDATED: 'Updated',
    BROWSE_BY_LOCATION: 'Browse by location',
    CLEAR_LOCATION: 'Clear location',
    FILTERED_BY_LOCATION: 'Filtered by location',
  },
})

langHelper.setLanguage(strings)
export { strings }

