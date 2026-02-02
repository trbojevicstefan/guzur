import LocalizedStrings from 'localized-strings'
import env from '@/config/env.config'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    CREATE_AGENCY_HEADING: 'Nouveau courtier',
    INVALID_AGENCY_NAME: 'Ce courtier existe deja.',
    AGENCY_IMAGE_SIZE_ERROR: `L'image doit etre au format ${env.AGENCY_IMAGE_WIDTH}x${env.AGENCY_IMAGE_HEIGHT}`,
    RECOMMENDED_IMAGE_SIZE: `Taille d'image recommandee : ${env.AGENCY_IMAGE_WIDTH}x${env.AGENCY_IMAGE_HEIGHT}`,
  },
  en: {
    CREATE_AGENCY_HEADING: 'New broker',
    INVALID_AGENCY_NAME: 'This broker already exists.',
    AGENCY_IMAGE_SIZE_ERROR: `The image must be in the format ${env.AGENCY_IMAGE_WIDTH}x${env.AGENCY_IMAGE_HEIGHT}`,
    RECOMMENDED_IMAGE_SIZE: `Recommended image size: ${env.AGENCY_IMAGE_WIDTH}x${env.AGENCY_IMAGE_HEIGHT}`,
  },
})

langHelper.setLanguage(strings)
export { strings }
