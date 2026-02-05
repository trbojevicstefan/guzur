import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SETTINGS_UPDATED: 'ParamÃ¨tres modifiÃ©s avec succÃ¨s.',
    NETWORK_SETTINGS: 'ParamÃ¨tres RÃ©seau',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Activer les notifications par email',
    PROFILE_TITLE: 'Paramètres du profil',
    PROFILE_SUBTITLE: 'Gérez votre profil personnel et vos préférences.',
    VERIFIED_ACCOUNT: 'Compte vérifié',
    MEMBER_SINCE: 'Membre premium depuis {year}',
    CHANGE_AVATAR: 'Changer l’avatar',
    SECTION_PERSONAL: 'Détails personnels',
    SECTION_SECURITY: 'Sécurité',
    SECTION_NOTIFICATIONS: 'Notifications',
    SECURITY_TITLE: 'Passcode & Login',
    SECURITY_SUBTITLE: 'Sécurisez votre compte avec un mot de passe unique.',
    NOTIFICATIONS_TITLE: 'Notifications',
    NOTIFICATIONS_SUBTITLE: 'Gérez vos préférences de communication.',
    UPDATE_PROFILE: 'Mettre à jour le profil',
    FOOTER_NOTE: 'Gestion des identités Guzur • Version 2.4.0',
  },
  ar: {

    SETTINGS_UPDATED: 'Settings updated successfully.',
    NETWORK_SETTINGS: 'Network settings',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Enable email notifications',
    PROFILE_TITLE: 'إعدادات الملف الشخصي',
    PROFILE_SUBTITLE: 'إدارة ملفك الشخصي وتفضيلاتك.',
    VERIFIED_ACCOUNT: 'حساب موثّق',
    MEMBER_SINCE: 'عضو منذ {year}',
    CHANGE_AVATAR: 'تغيير الصورة',
    SECTION_PERSONAL: 'البيانات الشخصية',
    SECTION_SECURITY: 'الأمان',
    SECTION_NOTIFICATIONS: 'الإشعارات',
    SECURITY_TITLE: 'كلمة المرور وتسجيل الدخول',
    SECURITY_SUBTITLE: 'قم بحماية حسابك بكلمة مرور فريدة.',
    NOTIFICATIONS_TITLE: 'الإشعارات',
    NOTIFICATIONS_SUBTITLE: 'تحكم في تفضيلات التواصل.',
    UPDATE_PROFILE: 'تحديث الملف',
    FOOTER_NOTE: 'إدارة الهوية Guzur • الإصدار 2.4.0',
  },
  en: {
    SETTINGS_UPDATED: 'Settings updated successfully.',
    NETWORK_SETTINGS: 'Network settings',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Enable email notifications',
    PROFILE_TITLE: 'Profile Settings',
    PROFILE_SUBTITLE: 'Manage your personal profile and platform preferences.',
    VERIFIED_ACCOUNT: 'Verified account',
    MEMBER_SINCE: 'Premium member since {year}',
    CHANGE_AVATAR: 'Change avatar',
    SECTION_PERSONAL: 'Personal details',
    SECTION_SECURITY: 'Security',
    SECTION_NOTIFICATIONS: 'Notifications',
    SECURITY_TITLE: 'Passcode & Login',
    SECURITY_SUBTITLE: 'Secure your account with a unique password.',
    NOTIFICATIONS_TITLE: 'Notifications',
    NOTIFICATIONS_SUBTITLE: 'Manage your communication preferences.',
    UPDATE_PROFILE: 'Update profile',
    FOOTER_NOTE: 'Guzur Identity Management • Version 2.4.0',
  },
})

langHelper.setLanguage(strings)
export { strings }

