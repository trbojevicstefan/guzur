import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Parcourir les projets',
    SEARCH: 'Recherche',
    SELECT_LOCATION: 'Choisissez une localisation',
    SELECT_DISTRICT: 'Choisissez un district',
    ALL_LOCATIONS: 'Toutes les localisations',
    BACK: 'Retour',
    NO_LOCATIONS: 'Aucune localisation.',
    VIEW_PROJECTS: 'Voir les projets',
  },
  ar: {

    HEADING: 'Browse projects',
    SEARCH: 'Search',
    SELECT_LOCATION: 'Choose a location',
    SELECT_DISTRICT: 'Choose a district',
    ALL_LOCATIONS: 'All locations',
    BACK: 'Back',
    NO_LOCATIONS: 'No locations yet.',
    VIEW_PROJECTS: 'View projects',
  },
  en: {
    HEADING: 'Browse projects',
    SEARCH: 'Search',
    SELECT_LOCATION: 'Choose a location',
    SELECT_DISTRICT: 'Choose a district',
    ALL_LOCATIONS: 'All locations',
    BACK: 'Back',
    NO_LOCATIONS: 'No locations yet.',
    VIEW_PROJECTS: 'View projects',
  },
})

langHelper.setLanguage(strings)
export { strings }

