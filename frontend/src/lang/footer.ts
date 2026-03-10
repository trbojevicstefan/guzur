import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const COPYRIGHT_PART1 = `Copyright Â© ${new Date().getFullYear()} ${env.WEBSITE_NAME}`

const strings = new LocalizedStrings({
  fr: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. Tous droits rÃ©servÃ©s.',

    CORPORATE: 'Ã€ Propos',
    ABOUT: 'Ã€ propos de Nous',
    TOS: "Conditions d'utilisation",
    RENT: 'Marketplace',
    BROKERS: 'Courtiers',
    DEVELOPERS: 'Promoteurs',
    LOCATIONS: 'Destinations',
    SUPPORT: 'Support',
    CONTACT: 'Contact',
    SECURE_PAYMENT: `Paiement 100% sÃ©curisÃ© avec ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'Politique de ConfidentialitÃ©',
    COOKIE_POLICY: 'Politique de cookies',
    BRAND_DESCRIPTION: 'Marketplace immobilier pour l’achat, la vente et la location dans les destinations les plus recherchées.',
  },
  ar: {

    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. All rights reserved.',

    CORPORATE: 'Corporate',
    ABOUT: 'About Us',
    TOS: 'Terms of Service',
    RENT: 'Marketplace',
    BROKERS: 'Brokers',
    DEVELOPERS: 'Developers',
    LOCATIONS: 'Destinations',
    SUPPORT: 'Support',
    CONTACT: 'Contact',
    SECURE_PAYMENT: `100% secure payment with ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'Privacy Policy',
    COOKIE_POLICY: 'Cookie Policy',
    BRAND_DESCRIPTION: 'Property marketplace for buying, selling, and renting in sought-after destinations.',
  },
  en: {
    COPYRIGHT_PART1,
    COPYRIGHT_PART2: '. All rights reserved.',

    CORPORATE: 'Corporate',
    ABOUT: 'About Us',
    TOS: 'Terms of Service',
    RENT: 'Marketplace',
    BROKERS: 'Brokers',
    DEVELOPERS: 'Developers',
    LOCATIONS: 'Destinations',
    SUPPORT: 'Support',
    CONTACT: 'Contact',
    SECURE_PAYMENT: `100% secure payment with ${env.WEBSITE_NAME}`,
    PRIVACY_POLICY: 'Privacy Policy',
    COOKIE_POLICY: 'Cookie Policy',
    BRAND_DESCRIPTION: 'Property marketplace for buying, selling, and renting in sought-after destinations.',
  },
})

langHelper.setLanguage(strings)
export { strings }

