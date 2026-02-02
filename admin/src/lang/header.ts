import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    DASHBOARD: 'Tableau de bord',
    SCHEDULER: 'Planificateur',
    HOME: 'Accueil',
    AGENCIES: 'Brokers',
    ORGANIZATIONS: 'Organisations',
    LOCATIONS: 'Lieux',
    PROPERTIES: 'Proprietes',
    DEVELOPMENTS: 'Developpements',
    DEVELOPERS: 'Developpeurs',
    OWNERS: 'Proprietaires',
    LEADS: 'Prospects',
    RFQS: 'Demandes RFQ',
    USERS: 'Utilisateurs',
    ABOUT: 'A propos',
    TOS: "Conditions d'utilisation",
    CONTACT: 'Contact',
    LANGUAGE: 'Langue',
    SETTINGS: 'Parametres',
    SIGN_OUT: 'Deconnexion',
    COUNTRIES: 'Pays',
  },
  en: {
    DASHBOARD: 'Dashboard',
    SCHEDULER: 'Property Scheduler',
    HOME: 'Home',
    AGENCIES: 'Brokers',
    ORGANIZATIONS: 'Organizations',
    LOCATIONS: 'Locations',
    PROPERTIES: 'Properties',
    DEVELOPMENTS: 'Developments',
    DEVELOPERS: 'Developers',
    OWNERS: 'Owners',
    LEADS: 'Leads',
    RFQS: 'RFQ Requests',
    USERS: 'Users',
    ABOUT: 'About',
    TOS: 'Terms of Service',
    CONTACT: 'Contact',
    LANGUAGE: 'Language',
    SETTINGS: 'Settings',
    SIGN_OUT: 'Sign out',
    COUNTRIES: 'Countries',
  },
})

langHelper.setLanguage(strings)
export { strings }

