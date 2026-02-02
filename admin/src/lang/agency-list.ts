import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    EMPTY_LIST: 'Aucun courtier.',
    VIEW_AGENCY: 'Voir le profil de ce courtier',
    DELETE_AGENCY: 'Etes-vous sur de vouloir supprimer ce courtier et toutes ses donnees ?',
  },
  en: {
    EMPTY_LIST: 'No brokers.',
    VIEW_AGENCY: 'View broker profile',
    DELETE_AGENCY: 'Are you sure you want to delete this broker and all its data?',
  },
})

langHelper.setLanguage(strings)
export { strings }
