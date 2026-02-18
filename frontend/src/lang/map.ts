import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SELECT_LOCATION: 'Choisir cette destination',
    VIEW_PROPERTY: 'Voir la propriÃ©tÃ©',
    STREET: 'Rue',
    SATELLITE: 'Satellite',
    MAP_INACTIVE: 'Carte verrouillÃ©e',
    MAP_ACTIVATE: 'Cliquer pour activer la carte',
    MAP_ACTIVATE_HINT: 'Faites dÃ©filer la page en sÃ©curitÃ©, puis cliquez pour zoomer et dÃ©placer',
    MAP_ACTIVE_HINT: 'Carte active - sortez avec la souris pour verrouiller',
  },
  ar: {

    SELECT_LOCATION: 'Select Destination',
    VIEW_PROPERTY: 'View Property',
    STREET: 'Street',
    SATELLITE: 'Satellite',
    MAP_INACTIVE: 'Map locked',
    MAP_ACTIVATE: 'Click to activate map',
    MAP_ACTIVATE_HINT: 'Scroll safely, then click to zoom and pan',
    MAP_ACTIVE_HINT: 'Map active - move cursor away to lock',
  },
  en: {
    SELECT_LOCATION: 'Select Destination',
    VIEW_PROPERTY: 'View Property',
    STREET: 'Street',
    SATELLITE: 'Satellite',
    MAP_INACTIVE: 'Map locked',
    MAP_ACTIVATE: 'Click to activate map',
    MAP_ACTIVATE_HINT: 'Scroll safely, then click to zoom and pan',
    MAP_ACTIVE_HINT: 'Map active - move cursor away to lock',
  },
})

langHelper.setLanguage(strings)
export { strings }

