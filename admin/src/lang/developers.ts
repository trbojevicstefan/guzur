import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    DEVELOPERS: 'Developpeurs',
    DEVELOPER: 'Developpeur',
    EMPTY_LIST: 'Aucun developpeur.',
    VIEW_PROFILE: 'Voir le profil',
    VIEW_PROJECTS: 'Voir les projets',
    PROJECTS: 'Projets',
    APPROVED: 'Approuve',
    PENDING: 'En attente',
  },
  en: {
    DEVELOPERS: 'Developers',
    DEVELOPER: 'Developer',
    EMPTY_LIST: 'No developers.',
    VIEW_PROFILE: 'View profile',
    VIEW_PROJECTS: 'View projects',
    PROJECTS: 'Projects',
    APPROVED: 'Approved',
    PENDING: 'Pending',
  },
})

langHelper.setLanguage(strings)
export { strings }
