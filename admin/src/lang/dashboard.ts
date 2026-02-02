import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    DASHBOARD: 'Tableau de bord',
    BOOKINGS: 'Reservations',
    PROPERTIES: 'Proprietes',
    LEADS: 'Prospects',
    DEVELOPMENTS: 'Developpements',
    BROKERS: 'Courtiers',
    OWNERS: 'Proprietaires',
    DEVELOPERS_PROJECTS: 'Developpeurs & Projets',
    DEVELOPERS: 'Developpeurs',
    PROJECTS: 'Projets',
  },
  en: {
    DASHBOARD: 'Dashboard',
    BOOKINGS: 'Bookings',
    PROPERTIES: 'Properties',
    LEADS: 'Leads',
    DEVELOPMENTS: 'Developments',
    BROKERS: 'Brokers',
    OWNERS: 'Owners',
    DEVELOPERS_PROJECTS: 'Developers & Projects',
    DEVELOPERS: 'Developers',
    PROJECTS: 'Projects',
  },
})

langHelper.setLanguage(strings)
export { strings }
