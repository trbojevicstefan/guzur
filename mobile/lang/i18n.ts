import { I18n } from 'i18n-js'
import { en } from './en'
import { ar } from './ar'

const i18n = new I18n({ en, ar })
i18n.enableFallback = true

export default i18n
