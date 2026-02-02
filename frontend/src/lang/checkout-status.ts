import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    CONGRATULATIONS: 'FÃ©licitation!',
    SUCCESS: 'Votre paiement a Ã©tÃ© effectuÃ© avec succÃ¨s. Nous vous avons envoyÃ© un e-mail de confirmation.',
    SUCCESS_PAY_LATER: 'Votre rÃ©servation a Ã©tÃ© effectuÃ©e avec succÃ¨s. Nous vous avons envoyÃ© un e-mail de confirmation.',
    ERROR: 'Something went wrong! Try again later',
    STATUS_TITLE: `${env.WEBSITE_NAME} Confirmation de rÃ©servation`,
    STATUS_MESSAGE: "VÃ©rifiez votre boÃ®te mail et suivez les Ã©tapes dÃ©crites dans l'e-mail de confirmation de la rÃ©servation pour rÃ©server votre propriÃ©tÃ©. Vous trouverez l'adresse de la propriÃ©tÃ© et le lien Google Maps dans l'e-mail de confirmation.",
  },
  ar: {

    CONGRATULATIONS: 'Congratulations!',
    SUCCESS: 'Your payment was successfully done. We sent you a confirmation email.',
    SUCCESS_PAY_LATER: 'Your booking was successfully done. We sent you a confirmation email.',
    ERROR: 'Something went wrong! Try again later',
    STATUS_TITLE: `${env.WEBSITE_NAME} Booking Confirmation`,
    STATUS_MESSAGE: 'Check your mailbox and follow the steps described in the booking confirmation email to book your property. You will find property address and Google Maps link in the confirmation email.',
  },
  en: {
    CONGRATULATIONS: 'Congratulations!',
    SUCCESS: 'Your payment was successfully done. We sent you a confirmation email.',
    SUCCESS_PAY_LATER: 'Your booking was successfully done. We sent you a confirmation email.',
    ERROR: 'Something went wrong! Try again later',
    STATUS_TITLE: `${env.WEBSITE_NAME} Booking Confirmation`,
    STATUS_MESSAGE: 'Check your mailbox and follow the steps described in the booking confirmation email to book your property. You will find property address and Google Maps link in the confirmation email.',
  },
})

langHelper.setLanguage(strings)
export { strings }

