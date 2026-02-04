import React, { useState } from 'react'
import {
  MailOutline,
  LockOutlined,
  Visibility,
  VisibilityOff,
  ArrowForward,
  AutoAwesome,
  PersonOutline,
  PhoneOutlined,
  CalendarMonth,
  WorkOutline,
  Apartment,
} from '@mui/icons-material'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/sign-up'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import Layout from '@/components/Layout'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import DatePicker from '@/components/DatePicker'
import SocialLogin from '@/components/SocialLogin'
import Footer from '@/components/Footer'

import '@/assets/css/signup.css'

const SignUp = () => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType

  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState<Date>()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(false)
  const [recaptchaError, setRecaptchaError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [passwordsDontMatch, setPasswordsDontMatch] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailValid, setEmailValid] = useState(true)
  const [tosChecked, setTosChecked] = useState(false)
  const [tosError, setTosError] = useState(false)
  const [phoneValid, setPhoneValid] = useState(true)
  const [phone, setPhone] = useState('')
  const [birthDateValid, setBirthDateValid] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)

    if (!e.target.value) {
      setEmailError(false)
      setEmailValid(true)
    }
  }

  const validateEmail = async (_email?: string) => {
    if (_email) {
      if (validator.isEmail(_email)) {
        try {
          const status = await UserService.validateEmail({ email: _email })
          if (status === 200) {
            setEmailError(false)
            setEmailValid(true)
            return true
          }
          setEmailError(true)
          setEmailValid(true)
          setError(false)
          return false
        } catch (err) {
          helper.error(err)
          setEmailError(false)
          setEmailValid(true)
          return false
        }
      } else {
        setEmailError(false)
        setEmailValid(false)
        return false
      }
    } else {
      setEmailError(false)
      setEmailValid(true)
      return false
    }
  }

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    await validateEmail(e.target.value)
  }

  const validatePhone = (_phone?: string) => {
    if (_phone) {
      const _phoneValid = validator.isMobilePhone(_phone)
      setPhoneValid(_phoneValid)

      return _phoneValid
    }
    setPhoneValid(true)

    return true
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value)

    if (!e.target.value) {
      setPhoneValid(true)
    }
  }

  const handlePhoneBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    validatePhone(e.target.value)
  }

  const validateBirthDate = (date?: Date) => {
    if (date && movininHelper.isDate(date)) {
      const now = new Date()
      const sub = intervalToDuration({ start: date, end: now }).years ?? 0
      const _birthDateValid = sub >= env.MINIMUM_AGE

      setBirthDateValid(_birthDateValid)
      return _birthDateValid
    }
    setBirthDateValid(true)
    return true
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordsDontMatch(false)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setPasswordsDontMatch(false)
  }

  const handleTosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTosChecked(e.target.checked)

    if (e.target.checked) {
      setTosError(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()

      const _emailValid = await validateEmail(email)
      if (!_emailValid) {
        return
      }

      const _phoneValid = validatePhone(phone)
      if (!_phoneValid) {
        return
      }

      const _birthDateValid = validateBirthDate(birthDate)
      if (!birthDate || !_birthDateValid) {
        return
      }

      if (password.length < 6) {
        setPasswordError(true)
        setRecaptchaError(false)
        setPasswordsDontMatch(false)
        setError(false)
        setTosError(false)
        return
      }

      if (password !== confirmPassword) {
        setPasswordError(false)
        setRecaptchaError(false)
        setPasswordsDontMatch(true)
        setError(false)
        setTosError(false)
        return
      }

      let recaptchaToken = ''
      if (reCaptchaLoaded) {
        recaptchaToken = await generateReCaptchaToken()
        if (!(await helper.verifyReCaptcha(recaptchaToken))) {
          recaptchaToken = ''
        }
      }

      if (env.RECAPTCHA_ENABLED && !recaptchaToken) {
        setRecaptchaError(true)
        return
      }

      if (!tosChecked) {
        setPasswordError(false)
        setRecaptchaError(false)
        setPasswordsDontMatch(false)
        setError(false)
        setTosError(true)
        return
      }

      setLoading(true)

      const data: movininTypes.SignUpPayload = {
        email,
        phone,
        password,
        fullName,
        birthDate,
        language: UserService.getLanguage(),
      }

      const status = await UserService.signup(data)

      if (status === 200) {
        const signInResult = await UserService.signin({
          email,
          password,
        })

        if (signInResult.status === 200) {
          const user = await UserService.getUser(signInResult.data._id)
          setUser(user)
          setUserLoaded(true)
          navigate(`/${window.location.search}`)
        } else {
          setPasswordError(false)
          setRecaptchaError(false)
          setPasswordsDontMatch(false)
          setError(true)
          setTosError(false)
        }
      } else {
        setPasswordError(false)
        setRecaptchaError(false)
        setPasswordsDontMatch(false)
        setError(true)
        setTosError(false)
      }
    } catch (err) {
      console.error(err)
      setPasswordError(false)
      setRecaptchaError(false)
      setPasswordsDontMatch(false)
      setError(true)
      setTosError(false)
    } finally {
      setLoading(false)
    }
  }

  const onLoad = (user?: movininTypes.User) => {
    if (user) {
      navigate('/')
    } else {
      setLanguage(UserService.getLanguage())
      setVisible(true)
    }
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      {visible && (
        <>
          <div className="signup-portal">
            <section className="signup-hero">
              <div className="signup-hero-media" />
              <div className="signup-hero-gradient" />
              <div className="signup-hero-content">
                <div className="signup-hero-logo">
                  <img src="/guzurlogo.png" alt="Guzur" />
                </div>

                <div className="signup-hero-body">
                  <div className="signup-hero-badge">
                    <AutoAwesome fontSize="inherit" />
                    <span>{strings.HERO_BADGE}</span>
                  </div>
                  <h1>
                    {strings.HERO_TITLE}
                    <span>{strings.HERO_HIGHLIGHT}</span>
                  </h1>
                  <p>{strings.HERO_BODY}</p>
                </div>

                <div className="signup-hero-footer">
                  <span>{strings.HERO_FOOTER}</span>
                  <span className="signup-hero-dot" />
                </div>
              </div>
            </section>

            <section className="signup-panel">
              <div className="signup-panel-inner">
                <div className="signup-panel-header">
                  <h2>{strings.SIGN_UP_HEADING}</h2>
                  <span className="signup-accent" />
                  <p>{strings.SIGN_UP_SUBTITLE}</p>
                </div>

                <form className="signup-form" onSubmit={handleSubmit}>
                  <div className="signup-field">
                    <label className="required">{commonStrings.FULL_NAME}</label>
                    <div className="signup-input">
                      <PersonOutline fontSize="small" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={handleFullNameChange}
                        placeholder={strings.FULL_NAME_PLACEHOLDER}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="signup-grid">
                    <div className="signup-field">
                      <label className="required">{commonStrings.EMAIL}</label>
                      <div className={`signup-input ${(!emailValid || emailError) ? 'is-error' : ''}`}>
                        <MailOutline fontSize="small" />
                        <input
                          type="email"
                          value={email}
                          onBlur={handleEmailBlur}
                          onChange={handleEmailChange}
                          placeholder={strings.EMAIL_PLACEHOLDER}
                          required
                          autoComplete="off"
                        />
                      </div>
                      {(!emailValid || emailError) && (
                        <span className="signup-help error">
                          {(!emailValid && commonStrings.EMAIL_NOT_VALID) || ''}
                          {(emailError && commonStrings.EMAIL_ALREADY_REGISTERED) || ''}
                        </span>
                      )}
                    </div>

                    <div className="signup-field">
                      <label className="required">{commonStrings.PHONE}</label>
                      <div className={`signup-input ${!phoneValid ? 'is-error' : ''}`}>
                        <PhoneOutlined fontSize="small" />
                        <input
                          type="tel"
                          value={phone}
                          onBlur={handlePhoneBlur}
                          onChange={handlePhoneChange}
                          placeholder={strings.PHONE_PLACEHOLDER}
                          required
                          autoComplete="off"
                        />
                      </div>
                      {!phoneValid && (
                        <span className="signup-help error">{commonStrings.PHONE_NOT_VALID}</span>
                      )}
                    </div>
                  </div>

                  <div className="signup-field">
                    <label className="required">{commonStrings.BIRTH_DATE}</label>
                    <div className="signup-date">
                      <CalendarMonth fontSize="small" />
                      <DatePicker
                        label={commonStrings.BIRTH_DATE}
                        value={birthDate}
                        variant="outlined"
                        required
                        onChange={(_birthDate) => {
                          if (_birthDate) {
                            const _birthDateValid = validateBirthDate(_birthDate)

                            setBirthDate(_birthDate)
                            setBirthDateValid(_birthDateValid)
                          }
                        }}
                        language={language}
                      />
                    </div>
                    {!birthDateValid && (
                      <span className="signup-help error">{commonStrings.BIRTH_DATE_NOT_VALID}</span>
                    )}
                  </div>

                  <div className="signup-grid">
                    <div className="signup-field">
                      <label className="required">{commonStrings.PASSWORD}</label>
                      <div className={`signup-input ${passwordError ? 'is-error' : ''}`}>
                        <LockOutlined fontSize="small" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder={strings.PASSWORD_PLACEHOLDER}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="signup-visibility"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? strings.HIDE_PASSWORD : strings.SHOW_PASSWORD}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </button>
                      </div>
                    </div>

                    <div className="signup-field">
                      <label className="required">{commonStrings.CONFIRM_PASSWORD}</label>
                      <div className={`signup-input ${passwordsDontMatch ? 'is-error' : ''}`}>
                        <LockOutlined fontSize="small" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={handleConfirmPasswordChange}
                          placeholder={strings.CONFIRM_PASSWORD_PLACEHOLDER}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`signup-tos ${tosError ? 'is-error' : ''}`}>
                    <label className="signup-checkbox">
                      <input type="checkbox" checked={tosChecked} onChange={handleTosChange} />
                      <span>{commonStrings.TOS}</span>
                    </label>
                  </div>

                  <div className="signup-actions">
                    <button type="submit" className="signup-submit">
                      {strings.SIGN_UP}
                      <ArrowForward fontSize="small" />
                    </button>

                    <SocialLogin
                      className="signup-social"
                      variant="button"
                      separatorLabel={strings.OR_CONTINUE_WITH}
                      googleLabel={strings.GOOGLE_ACCOUNT}
                      redirectToHomepage
                      onSignInError={() => setError(true)}
                    />
                  </div>

                  <div className="signup-partner">
                    <div className="signup-partner-badge">
                      <Apartment fontSize="small" />
                      <span>{strings.PARTNER_BADGE}</span>
                    </div>
                    <div className="signup-partner-content">
                      <h4>{strings.PARTNER_TITLE}</h4>
                      <p>{strings.PARTNER_BODY}</p>
                    </div>
                    <button type="button" className="signup-partner-btn" onClick={() => navigate('/sign-up/role')}>
                      <WorkOutline fontSize="small" />
                      {strings.PARTNER_ACTION}
                    </button>
                  </div>

                  <div className="signup-footer">
                    <span>{strings.HAS_ACCOUNT}</span>
                    <button type="button" onClick={() => navigate('/sign-in')}>
                      {strings.SIGN_IN}
                    </button>
                  </div>

                  <div className="signup-error">
                    {passwordError && <Error message={commonStrings.PASSWORD_ERROR} />}
                    {passwordsDontMatch && <Error message={commonStrings.PASSWORDS_DONT_MATCH} />}
                    {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
                    {tosError && <Error message={commonStrings.TOS_ERROR} />}
                    {error && <Error message={strings.SIGN_UP_ERROR} />}
                  </div>
                </form>
              </div>
            </section>
          </div>

          <Footer />
        </>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default SignUp
