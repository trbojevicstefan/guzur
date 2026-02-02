import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    HEADING: 'Developpeur',
    ABOUT: 'A propos',
    WEBSITE: 'Site web',
    PHONE: 'Telephone',
    SERVICE_AREAS: 'Zones de service',
    PROJECTS: 'Projets',
    EMPTY_PROJECTS: 'Aucun projet pour le moment.',
  },
  ar: {

    HEADING: 'Developer',
    ABOUT: 'About',
    WEBSITE: 'Website',
    PHONE: 'Phone',
    SERVICE_AREAS: 'Service areas',
    PROJECTS: 'Projects',
    EMPTY_PROJECTS: 'No projects yet.',
  },
  en: {
    HEADING: 'Developer',
    ABOUT: 'About',
    WEBSITE: 'Website',
    PHONE: 'Phone',
    SERVICE_AREAS: 'Service areas',
    PROJECTS: 'Projects',
    EMPTY_PROJECTS: 'No projects yet.',
  },
})

langHelper.setLanguage(strings)
export { strings }

