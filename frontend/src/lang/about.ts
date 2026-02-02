import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE1: `${env.WEBSITE_NAME} - Votre service de location de propriÃ©tÃ©s`,
    SUBTITLE1: 'Votre partenaire de confiance pour la location de propriÃ©tÃ©s',
    CONTENT1: `Chez ${env.WEBSITE_NAME}, nous comprenons que chaque voyage est unique. Nous nous engageons Ã  fournir Ã  nos clients une sÃ©lection diversifiÃ©e de propriÃ©tÃ©s qui rÃ©pondent Ã  tous les besoins de voyage. Que vous exploriez une ville, que vous vous dÃ©placiez pour affaires ou que vous recherchiez l'aventure, nos services de location de propriÃ©tÃ©s fiables garantissent que votre aventure commence en toute transparence. Notre mission est de fournir un service client exceptionnel, rendant votre expÃ©rience agrÃ©able et sans stress. Avec des tarifs compÃ©titifs, une variÃ©tÃ© de propriÃ©tÃ©s bien entretenus et une Ã©quipe dÃ©diÃ©e prÃªte Ã  vous aider, nous nous efforÃ§ons d'Ãªtre votre partenaire de confiance sur la route. Choisissez ${env.WEBSITE_NAME} pour tous vos besoins de location de propriÃ©tÃ© et dÃ©couvrez la libertÃ© d'explorer Ã  votre rythme.`,
    TITLE2: `Pourquoi choisir ${env.WEBSITE_NAME}`,
    SUBTITLE2: "DÃ©couvrez l'excellence Ã  chaque voyage",
    CONTENT2: "Profitez d'une commoditÃ©, d'une fiabilitÃ© et d'une valeur inÃ©galÃ©es avec notre service de location de propriÃ©tÃ©s. Des rÃ©servations sans effort aux propriÃ©tÃ©s de haute qualitÃ©, nous sommes votre partenaire de voyage de confiance.",
    FIND_DEAL: 'Trouver une Offre',
  },
  ar: {

    TITLE1: `${env.WEBSITE_NAME} - Your Premier Property Rental Service`,
    SUBTITLE1: 'Your Trusted Partner for Property Rentals',
    CONTENT1: `At ${env.WEBSITE_NAME}, we understand that every journey is unique. We are committed to providing our customers with a diverse selection of properties that cater to every travel need. Whether you're exploring a city, commuting for business, or seeking adventure, our reliable property rental services ensure that your adventure begins seamlessly. Our mission is to deliver exceptional customer service, making your experience enjoyable and stress-free. With competitive rates, a variety of well-maintained properties, and a dedicated team ready to assist you, we strive to be your trusted partner on the road. Choose ${env.WEBSITE_NAME} for all your property rental needs and experience the freedom to explore at your own pace.`,
    TITLE2: `Why Choose ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Experience Excellence in Every Journey',
    CONTENT2: "Enjoy unmatched convenience, reliability, and value with our premier property rental service. From effortless bookings to high-quality properties, we're your trusted travel partner.",
    FIND_DEAL: 'Find Deal',
  },
  en: {
    TITLE1: `${env.WEBSITE_NAME} - Your Premier Property Rental Service`,
    SUBTITLE1: 'Your Trusted Partner for Property Rentals',
    CONTENT1: `At ${env.WEBSITE_NAME}, we understand that every journey is unique. We are committed to providing our customers with a diverse selection of properties that cater to every travel need. Whether you're exploring a city, commuting for business, or seeking adventure, our reliable property rental services ensure that your adventure begins seamlessly. Our mission is to deliver exceptional customer service, making your experience enjoyable and stress-free. With competitive rates, a variety of well-maintained properties, and a dedicated team ready to assist you, we strive to be your trusted partner on the road. Choose ${env.WEBSITE_NAME} for all your property rental needs and experience the freedom to explore at your own pace.`,
    TITLE2: `Why Choose ${env.WEBSITE_NAME}`,
    SUBTITLE2: 'Experience Excellence in Every Journey',
    CONTENT2: "Enjoy unmatched convenience, reliability, and value with our premier property rental service. From effortless bookings to high-quality properties, we're your trusted travel partner.",
    FIND_DEAL: 'Find Deal',
  },
})

langHelper.setLanguage(strings)
export { strings }

