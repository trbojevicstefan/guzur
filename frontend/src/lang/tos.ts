import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE: "Conditions d'utilisation",
    TOS: `
Bienvenue chez ${env.WEBSITE_NAME} ! En accÃ©dant Ã  notre site Web et en utilisant nos services, vous acceptez de vous conformer et d'Ãªtre liÃ© par les conditions d'utilisation suivantes. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.

1. Acceptation des conditions

En accÃ©dant ou en utilisant nos services, vous confirmez avoir lu, compris et acceptÃ© ces conditions d'utilisation et notre politique de confidentialitÃ©.

2. Utilisation de nos services

Vous acceptez d'utiliser nos services uniquement Ã  des fins lÃ©gales et d'une maniÃ¨re qui ne porte pas atteinte aux droits, ne restreint ni n'empÃªche quiconque d'utiliser nos services. Cela inclut le respect de toutes les lois et rÃ©glementations applicables.

3. RÃ©servations et paiements

Lorsque vous effectuez une rÃ©servation avec ${env.WEBSITE_NAME}, vous acceptez de fournir des informations exactes et complÃ¨tes. Tous les paiements doivent Ãªtre effectuÃ©s via notre systÃ¨me de paiement sÃ©curisÃ©. Une fois le paiement effectuÃ©, vous recevrez une confirmation de votre rÃ©servation.

4. Politique d'annulation

Les annulations effectuÃ©es 24 heures avant la date de location peuvent donner droit Ã  un remboursement complet. Les annulations effectuÃ©es moins de 24 heures avant la date de location peuvent entraÃ®ner des frais d'annulation. Veuillez vous rÃ©fÃ©rer Ã  notre politique d'annulation pour des informations dÃ©taillÃ©es.

5. Conditions de location

Toutes les locations sont soumises Ã  nos conditions de location, qui incluent, sans s'y limiter, les restrictions d'Ã¢ge et les obligations d'assurance. Vous Ãªtes responsable de vous assurer que vous remplissez toutes les conditions avant d'effectuer une rÃ©servation.

6. Limitation de responsabilitÃ©

${env.WEBSITE_NAME} ne sera pas responsable des dommages indirects, accessoires ou consÃ©cutifs dÃ©coulant de votre utilisation de nos services. En aucun cas, notre responsabilitÃ© totale ne dÃ©passera le montant que vous avez payÃ© pour les services.

7. Modifications des conditions

Nous nous rÃ©servons le droit de modifier ces conditions de service Ã  tout moment. Toute modification entrera en vigueur immÃ©diatement aprÃ¨s sa publication sur notre site Web. Votre utilisation continue de nos services aprÃ¨s toute modification constitue votre acceptation des nouvelles conditions.

8. Loi applicable

Ces conditions de service seront rÃ©gies et interprÃ©tÃ©es conformÃ©ment aux lois. Tout litige dÃ©coulant de ces conditions sera rÃ©solu devant les tribunaux.

9. CoordonnÃ©es

Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter Ã  l'adresse ${env.CONTACT_EMAIL}. Nous sommes lÃ  pour vous aider pour toute demande relative Ã  nos services.

10. Reconnaissance

En utilisant nos services, vous reconnaissez avoir lu et compris ces conditions d'utilisation et acceptez d'Ãªtre liÃ© par elles.    
    `,
  },
  ar: {

    TITLE: 'Terms of Service',
    TOS: `
Welcome to ${env.WEBSITE_NAME}! By accessing our website and using our services, you agree to comply with and be bound by the following Terms of Service. If you do not agree to these terms, please do not use our services.


1. Acceptance of Terms

By accessing or using our services, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy.


2. Use of Our Services

You agree to use our services only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else's use of our services. This includes compliance with all applicable laws and regulations.


3. Reservations and Payments

When you make a reservation with ${env.WEBSITE_NAME}, you agree to provide accurate and complete information. All payments must be made through our secure payment system. Once payment is completed, you will receive a confirmation of your reservation.


4. Cancellation Policy

Cancellations made 24 hours before the rental date may be eligible for a full refund. Cancellations made less than 24 hours prior to the rental date may incur a cancellation fee. Please refer to our cancellation policy for detailed information.


5. Rental Conditions

All rentals are subject to our rental conditions, which include but are not limited to age restrictions and insurance obligations. You are responsible for ensuring that you meet all requirements before making a reservation.


6. Limitation of Liability

${env.WEBSITE_NAME} shall not be liable for any indirect, incidental, or consequential damages arising out of your use of our services. In no event shall our total liability exceed the amount paid by you for the services.


7. Modifications to Terms

We reserve the right to modify these Terms of Service at any time. Any changes will be effective immediately upon posting on our website. Your continued use of our services following any changes constitutes your acceptance of the new terms.


8. Governing Law

These Terms of Service shall be governed by and construed in accordance with the laws. Any disputes arising out of these terms shall be resolved in the courts.


9. Contact Information

If you have any questions regarding these Terms of Service, please contact us at ${env.CONTACT_EMAIL}. We are here to help you with any inquiries related to our services.


10. Acknowledgment

By using our services, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
    `,
  },
  en: {
    TITLE: 'Terms of Service',
    TOS: `
Welcome to ${env.WEBSITE_NAME}! By accessing our website and using our services, you agree to comply with and be bound by the following Terms of Service. If you do not agree to these terms, please do not use our services.


1. Acceptance of Terms

By accessing or using our services, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy.


2. Use of Our Services

You agree to use our services only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else's use of our services. This includes compliance with all applicable laws and regulations.


3. Reservations and Payments

When you make a reservation with ${env.WEBSITE_NAME}, you agree to provide accurate and complete information. All payments must be made through our secure payment system. Once payment is completed, you will receive a confirmation of your reservation.


4. Cancellation Policy

Cancellations made 24 hours before the rental date may be eligible for a full refund. Cancellations made less than 24 hours prior to the rental date may incur a cancellation fee. Please refer to our cancellation policy for detailed information.


5. Rental Conditions

All rentals are subject to our rental conditions, which include but are not limited to age restrictions and insurance obligations. You are responsible for ensuring that you meet all requirements before making a reservation.


6. Limitation of Liability

${env.WEBSITE_NAME} shall not be liable for any indirect, incidental, or consequential damages arising out of your use of our services. In no event shall our total liability exceed the amount paid by you for the services.


7. Modifications to Terms

We reserve the right to modify these Terms of Service at any time. Any changes will be effective immediately upon posting on our website. Your continued use of our services following any changes constitutes your acceptance of the new terms.


8. Governing Law

These Terms of Service shall be governed by and construed in accordance with the laws. Any disputes arising out of these terms shall be resolved in the courts.


9. Contact Information

If you have any questions regarding these Terms of Service, please contact us at ${env.CONTACT_EMAIL}. We are here to help you with any inquiries related to our services.


10. Acknowledgment

By using our services, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
    `,
  },
})

langHelper.setLanguage(strings)
export { strings }

