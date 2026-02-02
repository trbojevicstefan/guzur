import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    PROPERTY: 'PropriÃ©tÃ©',
    AGENCY: 'Agence',
    PRICE: 'Prix',
    STATUS: 'Statut',
    EMPTY_LIST: 'Pas de rÃ©servations.',
    VIEW: 'Voir cette rÃ©servation',
    DAYS: 'Jours',
    COST: 'Total',
    CANCEL: 'Annuler cette rÃ©servation',
    CANCEL_BOOKING: 'ÃŠtes-vous sÃ»r de vouloir annuler cette rÃ©servation ?',
    CANCEL_BOOKING_REQUEST_SENT: "Votre requÃªte d'annulation a bien Ã©tÃ© prise en compte. Nous vous contacterons pour finaliser la procÃ©dure d'annulation.",
  },
  ar: {

    PROPERTY: 'Property',
    AGENCY: 'Agency',
    PRICE: 'Price',
    STATUS: 'Status',
    EMPTY_LIST: 'No bookings.',
    VIEW: 'View this booking',
    DAYS: 'Days',
    COST: 'COST',
    CANCEL: 'Cancel this booking',
    CANCEL_BOOKING: 'Are you sure you want to cancel this booking?',
    CANCEL_BOOKING_REQUEST_SENT: 'Your cancel request has been submited. We will contact you to finalize the cancellation procedure.',
  },
  en: {
    PROPERTY: 'Property',
    AGENCY: 'Agency',
    PRICE: 'Price',
    STATUS: 'Status',
    EMPTY_LIST: 'No bookings.',
    VIEW: 'View this booking',
    DAYS: 'Days',
    COST: 'COST',
    CANCEL: 'Cancel this booking',
    CANCEL_BOOKING: 'Are you sure you want to cancel this booking?',
    CANCEL_BOOKING_REQUEST_SENT: 'Your cancel request has been submited. We will contact you to finalize the cancellation procedure.',
  },
})

langHelper.setLanguage(strings)
export { strings }

