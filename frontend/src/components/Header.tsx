import React, { memo, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Mail as MailIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  InfoTwoTone as AboutIcon,
  DescriptionTwoTone as TosIcon,
  ExitToApp as SignoutIcon,
  Login as LoginIcon,
  EventSeat as BookingsIcon,
  Business as AgencyIcon,
  LocationOn as LocationIcon,
  PersonOutline as SignUpIcon,
  PrivacyTip as PrivacyIcon,
  Cookie as CookiePolicyIcon,
  Apartment as ProjectsIcon,
  Bolt as PulseIcon,
  RequestQuote as RfqIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { gsap } from 'gsap'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as suStrings } from '@/lang/sign-up'
import { strings } from '@/lang/header'
import * as UserService from '@/services/UserService'
import * as PaymentService from '@/services/PaymentService'
import Avatar from '@/components/Avatar'
import * as langHelper from '@/utils/langHelper'
import * as helper from '@/utils/helper'
import { useNotificationContext, NotificationContextType } from '@/context/NotificationContext'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/header.css'

const getFlagSrc = (countryCode?: string) => `https://flagcdn.com/w20/${String(countryCode || 'us').toLowerCase()}.png`

interface HeaderProps {
  hidden?: boolean
  hideSignin?: boolean
}

const Header = ({
  hidden,
  hideSignin,
}: HeaderProps) => {
  const navigate = useNavigate()
  const { user } = useUserContext() as UserContextType
  const { notificationCount, messageCount } = useNotificationContext() as NotificationContextType

  const [currentUser, setCurrentUser] = useState<movininTypes.User>()
  const [lang, setLang] = useState(helper.getLanguage(env.DEFAULT_LANGUAGE))
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const [accountAnchorEl, setAccountAnchorEl] = useState<HTMLElement | null>(null)
  const [langAnchorEl, setLangAnchorEl] = useState<HTMLElement | null>(null)
  const [currencyAnchorEl, setCurrencyAnchorEl] = useState<HTMLElement | null>(null)

  const sideMenuRef = useRef<HTMLDivElement | null>(null)
  const sideOverlayRef = useRef<HTMLDivElement | null>(null)

  const isPartner = currentUser && [
    movininTypes.UserType.Broker,
    movininTypes.UserType.Developer,
    movininTypes.UserType.Owner,
  ].includes(currentUser.type as movininTypes.UserType)

  useEffect(() => {
    const language = langHelper.getLanguage()
    setLang(helper.getLanguage(language))
    langHelper.setLanguage(strings, language)
  }, [])

  useEffect(() => {
    if (user) {
      setCurrentUser(user)
      setIsSignedIn(true)
    } else {
      setCurrentUser(undefined)
      setIsSignedIn(false)
    }
    setIsLoaded(true)
  }, [user])

  useEffect(() => {
    const sideMenu = sideMenuRef.current
    const sideOverlay = sideOverlayRef.current
    if (!sideMenu || !sideOverlay) {
      return
    }

    gsap.set(sideMenu, { x: -360 })
    gsap.set(sideOverlay, {
      autoAlpha: 0,
      pointerEvents: 'none',
    })
  }, [])

  useEffect(() => {
    const sideMenu = sideMenuRef.current
    const sideOverlay = sideOverlayRef.current
    if (!sideMenu || !sideOverlay) {
      return
    }

    if (isSideMenuOpen) {
      gsap.to(sideMenu, {
        x: 0,
        duration: 0.62,
        ease: 'expo.out',
      })
      gsap.set(sideOverlay, { pointerEvents: 'auto' })
      gsap.to(sideOverlay, {
        autoAlpha: 1,
        duration: 0.38,
        ease: 'power2.out',
      })
      document.body.classList.add('menu-open')
      return
    }

    gsap.to(sideMenu, {
      x: -360,
      duration: 0.5,
      ease: 'expo.inOut',
    })
    gsap.to(sideOverlay, {
      autoAlpha: 0,
      duration: 0.3,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set(sideOverlay, { pointerEvents: 'none' })
      },
    })
    document.body.classList.remove('menu-open')
  }, [isSideMenuOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSideMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const refreshPage = () => {
    navigate(0)
  }

  const handleLanguageSelect = async (code: string) => {
    setLangAnchorEl(null)
    if (!code) {
      return
    }

    setLang(helper.getLanguage(code))
    const currentLang = UserService.getLanguage()

    if (isSignedIn && user) {
      const data: movininTypes.UpdateLanguagePayload = {
        id: user._id as string,
        language: code,
      }
      const status = await UserService.updateLanguage(data)
      if (status === 200) {
        UserService.setLanguage(code)
        if (code !== currentLang) {
          refreshPage()
        }
      } else {
        toast(commonStrings.CHANGE_LANGUAGE_ERROR, { type: 'error' })
      }
      return
    }

    UserService.setLanguage(code)
    if (code !== currentLang) {
      refreshPage()
    }
  }

  const handleCurrencySelect = (code: string) => {
    setCurrencyAnchorEl(null)
    if (!code) {
      return
    }

    const currentCurrency = PaymentService.getCurrency()
    if (code !== currentCurrency) {
      PaymentService.setCurrency(code)
      refreshPage()
    }
  }

  const handleSignout = async () => {
    await UserService.signout(true, false)
    setAccountAnchorEl(null)
  }

  const navigateAndClose = (path: string) => {
    navigate(path)
    setIsSideMenuOpen(false)
  }

  const renderAccountMenu = (
    <Menu
      anchorEl={accountAnchorEl}
      open={Boolean(accountAnchorEl)}
      onClose={() => setAccountAnchorEl(null)}
      className="menu"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {isPartner && (
        <MenuItem
          onClick={() => {
            setAccountAnchorEl(null)
            navigate('/dashboard')
          }}
        >
          <DashboardIcon className="header-action" />
          {strings.DASHBOARD}
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          setAccountAnchorEl(null)
          navigate('/messages')
        }}
      >
        <MailIcon className="header-action" />
        {strings.PULSE}
      </MenuItem>
      <MenuItem
        onClick={() => {
          setAccountAnchorEl(null)
          navigate('/settings')
        }}
      >
        <SettingsIcon className="header-action" />
        {strings.SETTINGS}
      </MenuItem>
      <MenuItem onClick={handleSignout}>
        <SignoutIcon className="header-action" />
        {strings.SIGN_OUT}
      </MenuItem>
    </Menu>
  )

  const renderLanguageMenu = (
    <Menu
      anchorEl={langAnchorEl}
      open={Boolean(langAnchorEl)}
      onClose={() => setLangAnchorEl(null)}
      className="menu"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {env._LANGUAGES.map((language) => (
        <MenuItem key={language.code} onClick={() => handleLanguageSelect(language.code)}>
          <div className="language">
            <img src={getFlagSrc(language.countryCode)} className="flag" alt={language.label} loading="lazy" />
            <span>{language.label}</span>
          </div>
        </MenuItem>
      ))}
    </Menu>
  )

  const renderCurrencyMenu = (
    <Menu
      anchorEl={currencyAnchorEl}
      open={Boolean(currencyAnchorEl)}
      onClose={() => setCurrencyAnchorEl(null)}
      className="menu"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      {env.CURRENCIES.map((_currency) => (
        <MenuItem key={_currency.code} onClick={() => handleCurrencySelect(_currency.code)}>
          {_currency.code}
        </MenuItem>
      ))}
    </Menu>
  )

  return (
    (!hidden && (
      <div className={`header luxury-header${isSideMenuOpen ? ' menu-open' : ''}`}>
        <div className="lux-sidebar-overlay" ref={sideOverlayRef} onClick={() => setIsSideMenuOpen(false)} />
        <aside className="lux-sidebar" ref={sideMenuRef}>
          <button
            type="button"
            className="lux-sidebar-brand"
            onClick={() => navigateAndClose('/')}
            aria-label={env.WEBSITE_NAME}
          >
            <img src="/guzurlogo.png" alt={env.WEBSITE_NAME} className="lux-sidebar-brand-img" />
            <span className="lux-sidebar-brand-text">{env.WEBSITE_NAME}</span>
          </button>

          <div className="lux-sidebar-links">
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/')}>
              <HomeIcon />
              <span>{strings.HOME}</span>
            </button>
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/brokers')}>
              <AgencyIcon />
              <span>{strings.BROKERS}</span>
            </button>
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/developers')}>
              <AgencyIcon />
              <span>{strings.DEVELOPERS}</span>
            </button>
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/projects')}>
              <ProjectsIcon />
              <span>{strings.PROJECTS}</span>
            </button>
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/destinations')}>
              <LocationIcon />
              <span>{strings.LOCATIONS}</span>
            </button>
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/about')}>
              <AboutIcon />
              <span>{strings.ABOUT}</span>
            </button>
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/contact')}>
              <MailIcon />
              <span>{strings.CONTACT}</span>
            </button>
            <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/rfq')}>
              <RfqIcon />
              <span>{strings.RFQ}</span>
            </button>
            {isSignedIn && (
              <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/bookings')}>
                <BookingsIcon />
                <span>{strings.BOOKINGS}</span>
              </button>
            )}
            {isSignedIn && isPartner && (
              <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/dashboard')}>
                <DashboardIcon />
                <span>{strings.DASHBOARD}</span>
              </button>
            )}
            {!hideSignin && !isSignedIn && isLoaded && (
              <>
                <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/sign-up')}>
                  <SignUpIcon />
                  <span>{suStrings.SIGN_UP}</span>
                </button>
                <button type="button" className="lux-sidebar-item" onClick={() => navigateAndClose('/sign-in')}>
                  <LoginIcon />
                  <span>{strings.SIGN_IN}</span>
                </button>
              </>
            )}
          </div>

          <div className="lux-sidebar-footer">
            <button type="button" className="lux-legal-link" onClick={() => navigateAndClose('/cookie-policy')}>
              <CookiePolicyIcon />
              {strings.COOKIE_POLICY}
            </button>
            <button type="button" className="lux-legal-link" onClick={() => navigateAndClose('/privacy')}>
              <PrivacyIcon />
              {strings.PRIVACY_POLICY}
            </button>
            <button type="button" className="lux-legal-link" onClick={() => navigateAndClose('/tos')}>
              <TosIcon />
              {strings.TOS}
            </button>
          </div>
        </aside>

        <header className="lux-nav">
          <div className="lux-nav-left">
            <button
              type="button"
              className="lux-menu-icon"
              onClick={() => setIsSideMenuOpen((prev) => !prev)}
              aria-label="Open navigation menu"
            >
              <span />
              <span />
              <span />
            </button>

            <button
              type="button"
              className="lux-logo-wrap"
              onClick={() => navigate('/')}
              aria-label={env.WEBSITE_NAME}
            >
              <img src="/guzurlogo.png" alt={env.WEBSITE_NAME} className="lux-logo-img" />
              <span className="lux-logo-text">{env.WEBSITE_NAME}</span>
            </button>
          </div>

          <div className="lux-nav-center">
            <button type="button" className="lux-icon-btn" onClick={() => navigate('/search')}>
              <SearchIcon />
              <span>{commonStrings.SEARCH.toUpperCase()}</span>
            </button>
            <button type="button" className="lux-icon-btn" onClick={() => navigate('/rfq')}>
              <HomeIcon />
              <span>{strings.RFQ.toUpperCase()}</span>
            </button>
          </div>

          <div className="lux-nav-right">
            <button
              type="button"
              className="lux-meta-trigger lux-currency-trigger"
              onClick={(event) => setCurrencyAnchorEl(event.currentTarget)}
            >
              {PaymentService.getCurrency()}
            </button>

            <button
              type="button"
              className="lux-meta-trigger lux-language-trigger"
              onClick={(event) => setLangAnchorEl(event.currentTarget)}
              aria-label={strings.LANGUAGE}
            >
              <img
                src={getFlagSrc(lang?.countryCode)}
                className="lux-flag-icon"
                alt={lang?.label || strings.LANGUAGE}
                loading="lazy"
              />
            </button>

            {!hideSignin && !isSignedIn && isLoaded && (
              <div className="lux-auth-links">
                <button type="button" onClick={() => navigate('/sign-up')}>
                  {suStrings.SIGN_UP}
                </button>
                <span>|</span>
                <button type="button" onClick={() => navigate('/sign-in')}>
                  {strings.SIGN_IN}
                </button>
              </div>
            )}

            {isSignedIn && (
              <div className="lux-user-actions">
                <IconButton aria-label="Notifications" onClick={() => navigate('/notifications')} className="lux-icon-plain">
                  <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                <IconButton aria-label={strings.PULSE} onClick={() => navigate('/messages')} className="lux-icon-plain">
                  <Badge badgeContent={messageCount > 0 ? messageCount : null} color="error">
                    <PulseIcon />
                  </Badge>
                </IconButton>
                <IconButton
                  aria-label={strings.SETTINGS}
                  onClick={(event) => setAccountAnchorEl(event.currentTarget)}
                  className="lux-icon-plain"
                >
                  <Avatar loggedUser={currentUser} user={currentUser} size="small" readonly />
                </IconButton>
              </div>
            )}

            {!isSignedIn && (
              <IconButton
                className="lux-mobile-lang"
                aria-label={strings.LANGUAGE}
                onClick={(event) => setLangAnchorEl(event.currentTarget)}
              >
                <LanguageIcon />
              </IconButton>
            )}
          </div>
        </header>

        {renderAccountMenu}
        {renderLanguageMenu}
        {renderCurrencyMenu}
      </div>
    )) || <></>
  )
}

export default memo(Header)
