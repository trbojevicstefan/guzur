import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    DEVELOPMENTS: 'Developpements',
    NEW_DEVELOPMENT: 'Nouveau developpement',
    NAME: 'Nom',
    STATUS: 'Statut',
    UNITS: 'Unites',
    UPDATED: 'Mis a jour',
    DEVELOPER: 'Developpeur',
    MASTER_PLAN: 'Plan directeur',
    FLOOR_PLANS: 'Plans',
    LATITUDE: 'Latitude',
    LONGITUDE: 'Longitude',
  },
  en: {
    DEVELOPMENTS: 'Developments',
    NEW_DEVELOPMENT: 'New development',
    NAME: 'Name',
    STATUS: 'Status',
    UNITS: 'Units',
    UPDATED: 'Updated',
    DEVELOPER: 'Developer',
    MASTER_PLAN: 'Master plan',
    FLOOR_PLANS: 'Floor plans',
    LATITUDE: 'Latitude',
    LONGITUDE: 'Longitude',
  },
})

langHelper.setLanguage(strings)
export { strings }
