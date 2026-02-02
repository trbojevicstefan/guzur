import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'
import env from '@/config/env.config'

const strings = new LocalizedStrings({
  fr: {
    TITLE: 'Politique de ConfidentialitÃ©',
    PRIVACY_POLICY: `
Votre vie privÃ©e est importante pour nous chez ${env.WEBSITE_NAME}. Cette politique de confidentialitÃ© dÃ©crit comment nous collectons, utilisons et protÃ©geons vos informations lorsque vous utilisez notre site Web et nos services. En accÃ©dant Ã  nos services, vous consentez aux pratiques dÃ©crites dans cette politique.

1. Informations que nous collectons

Nous collectons des informations auprÃ¨s de vous lorsque vous vous inscrivez sur notre site, passez une commande ou interagissez avec nos services. Les informations que nous pouvons collecter comprennent :

Nom
Adresse e-mail
NumÃ©ro de tÃ©lÃ©phone
Informations de paiement
PrÃ©fÃ©rences de location
Vous pouvez visiter notre site de maniÃ¨re anonyme, mais certaines fonctionnalitÃ©s peuvent Ãªtre limitÃ©es.

2. Comment nous utilisons vos informations

Vos informations peuvent Ãªtre utilisÃ©es des maniÃ¨res suivantes :

Pour traiter vos rÃ©servations et paiements
Pour amÃ©liorer le service client
Pour envoyer des e-mails pÃ©riodiques concernant votre commande ou d'autres produits et services
Pour rÃ©pondre aux demandes de renseignements et d'assistance

3. Comment nous protÃ©geons vos informations

Nous mettons en Å“uvre diverses mesures de sÃ©curitÃ© pour maintenir la sÃ©curitÃ© de vos informations personnelles. Toutes les informations sensibles sont transmises via des serveurs sÃ©curisÃ©s et ne sont accessibles qu'au personnel autorisÃ©. Nous ne stockons pas vos informations de carte de crÃ©dit sur nos serveurs.

4. Partage de vos informations

Nous ne vendons, n'Ã©changeons ni ne transfÃ©rons vos informations personnelles identifiables Ã  des tiers, sauf Ã  des partenaires de confiance qui nous aident Ã  exploiter notre site Web, Ã  mener nos activitÃ©s ou Ã  vous fournir des services, tant que ces parties acceptent de garder ces informations confidentielles. Nous pouvons Ã©galement divulguer vos informations lorsque nous pensons que cette divulgation est appropriÃ©e pour se conformer Ã  la loi, appliquer les politiques de notre site ou protÃ©ger nos droits ou ceux d'autrui, notre propriÃ©tÃ© ou notre sÃ©curitÃ©.

5. ConfidentialitÃ© des enfants

Nous respectons la loi sur la protection de la vie privÃ©e des enfants en ligne (Children's Online Privacy Protection Act, COPPA). Nos services ne sont pas destinÃ©s aux enfants de moins de 13 ans et nous ne collectons pas sciemment d'informations personnelles auprÃ¨s d'enfants de moins de 13 ans. Si nous apprenons que nous avons collectÃ© des informations personnelles auprÃ¨s d'un enfant de moins de 13 ans, nous prendrons des mesures pour supprimer ces informations.

6. Modifications de notre politique de confidentialitÃ©

Nous pouvons mettre Ã  jour cette politique de confidentialitÃ© de temps Ã  autre. Nous vous informerons de tout changement en publiant la nouvelle politique de confidentialitÃ© sur cette page. Il vous est conseillÃ© de consulter rÃ©guliÃ¨rement cette politique de confidentialitÃ© pour prendre connaissance de tout changement.

7. Vos droits

Vous avez le droit de demander l'accÃ¨s aux informations personnelles que nous dÃ©tenons Ã  votre sujet, de demander la correction de toute inexactitude et de demander la suppression de vos informations personnelles, sous rÃ©serve de certaines exceptions. Pour exercer ces droits, veuillez nous contacter en utilisant les informations fournies ci-dessous.

8. Contactez-nous

Si vous avez des questions sur cette politique de confidentialitÃ© ou sur nos pratiques en matiÃ¨re de donnÃ©es, veuillez nous contacter Ã  l'adresse ${env.CONTACT_EMAIL}. Nous nous engageons Ã  rÃ©pondre Ã  vos prÃ©occupations et Ã  protÃ©ger votre vie privÃ©e.

9. Reconnaissance

En utilisant nos services, vous reconnaissez avoir lu et compris cette politique de confidentialitÃ© et acceptez ses conditions.    
    `,
  },
  ar: {

    TITLE: 'Privacy Policy',
    PRIVACY_POLICY: `
Your privacy is important to us at ${env.WEBSITE_NAME}. This Privacy Policy outlines how we collect, use, and protect your information when you use our website and services. By accessing our services, you consent to the practices described in this policy.


1. Information We Collect

We collect information from you when you register on our site, place an order, or interact with our services. The information we may collect includes:

Name
Email address
Phone number
Payment information
Rental preferences
You may visit our site anonymously, but certain functionalities may be limited.


2. How We Use Your Information

Your information may be used in the following ways:

To process your reservations and payments
To improve customer service
To send periodic emails regarding your order or other products and services
To respond to inquiries and support requests


3. How We Protect Your Information

We implement a variety of security measures to maintain the safety of your personal information. All sensitive information is transmitted via secure servers and is only accessible by authorized personnel. We do not store your credit card information on our servers.


4. Sharing Your Information

We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except to trusted partners who assist us in operating our website, conducting our business, or servicing you, as long as those parties agree to keep this information confidential. We may also release your information when we believe release is appropriate to comply with the law, enforce our site policies, or protect our rights or others' rights, property, or safety.


5. Children's Privacy

We comply with the Children's Online Privacy Protection Act (COPPA). Our services are not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.


6. Changes to Our Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.


7. Your Rights

You have the right to request access to the personal information we hold about you, to request correction of any inaccuracies, and to request deletion of your personal information, subject to certain exceptions. To exercise these rights, please contact us using the information provided below.


8. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us at ${env.CONTACT_EMAIL}. We are committed to addressing your concerns and protecting your privacy.


9. Acknowledgment

By using our services, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
    `,
  },
  en: {
    TITLE: 'Privacy Policy',
    PRIVACY_POLICY: `
Your privacy is important to us at ${env.WEBSITE_NAME}. This Privacy Policy outlines how we collect, use, and protect your information when you use our website and services. By accessing our services, you consent to the practices described in this policy.


1. Information We Collect

We collect information from you when you register on our site, place an order, or interact with our services. The information we may collect includes:

Name
Email address
Phone number
Payment information
Rental preferences
You may visit our site anonymously, but certain functionalities may be limited.


2. How We Use Your Information

Your information may be used in the following ways:

To process your reservations and payments
To improve customer service
To send periodic emails regarding your order or other products and services
To respond to inquiries and support requests


3. How We Protect Your Information

We implement a variety of security measures to maintain the safety of your personal information. All sensitive information is transmitted via secure servers and is only accessible by authorized personnel. We do not store your credit card information on our servers.


4. Sharing Your Information

We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties, except to trusted partners who assist us in operating our website, conducting our business, or servicing you, as long as those parties agree to keep this information confidential. We may also release your information when we believe release is appropriate to comply with the law, enforce our site policies, or protect our rights or others' rights, property, or safety.


5. Children's Privacy

We comply with the Children's Online Privacy Protection Act (COPPA). Our services are not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.


6. Changes to Our Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.


7. Your Rights

You have the right to request access to the personal information we hold about you, to request correction of any inaccuracies, and to request deletion of your personal information, subject to certain exceptions. To exercise these rights, please contact us using the information provided below.


8. Contact Us

If you have any questions about this Privacy Policy or our data practices, please contact us at ${env.CONTACT_EMAIL}. We are committed to addressing your concerns and protecting your privacy.


9. Acknowledgment

By using our services, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
    `,
  },
})

langHelper.setLanguage(strings)
export { strings }

