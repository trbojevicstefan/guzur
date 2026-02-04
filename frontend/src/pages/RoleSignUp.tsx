import React, { useState } from 'react'
import {
  MailOutline,
  LockOutlined,
  Visibility,
  VisibilityOff,
  ArrowForward,
  AutoAwesome,
  WorkOutline,
  Apartment,
  HomeOutlined,
  NorthEast,
  West,
  PersonOutline,
  PhoneOutlined,
} from '@mui/icons-material'
import validator from 'validator'
import { useNavigate, useParams } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings as signUpStrings } from '@/lang/sign-up'
import { strings } from '@/lang/sign-up-role'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import Layout from '@/components/Layout'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import Footer from '@/components/Footer'

import '@/assets/css/role-signup.css'

const roleMap: Record<string, movininTypes.UserType> = {
  broker: movininTypes.UserType.Broker,
  developer: movininTypes.UserType.Developer,
  owner: movininTypes.UserType.Owner,
}

const RoleSignUp = () => {
  const navigate = useNavigate()
  const { role } = useParams()
  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
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
  const [showPassword, setShowPassword] = useState(false)

  const resolvedRole = role ? roleMap[role.toLowerCase()] : undefined

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
      const _phoneValid = validator.isMobilePhone(_phone, 'any')
      setPhoneValid(_phoneValid)
      return _phoneValid
    }
    setPhoneValid(true)
    return true
  }

  const handlePhoneBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    validatePhone(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()

      if (!resolvedRole) {
        return
      }

      const _emailValid = await validateEmail(email)
      if (!_emailValid) {
        return
      }

      const _phoneValid = validatePhone(phone)
      if (!_phoneValid) {
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
        language: UserService.getLanguage(),
      }

      const status = await UserService.signupRole(resolvedRole, data)

      if (status === 200) {
        const signInResult = await UserService.signin({
          email,
          password,
        })

        if (signInResult.status === 200) {
          const user = await UserService.getUser(signInResult.data._id)
          setUser(user)
          setUserLoaded(true)
          navigate('/onboarding')
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
      setVisible(true)
    }
  }

  if (!resolvedRole) {
    return (
      <Layout strict={false} onLoad={onLoad}>
        {visible && (
          <>
            <div className="role-portal">
              <section className="role-hero">
                <div className="role-hero-media" />
                <div className="role-hero-gradient" />
                <div className="role-hero-content">
                  <div className="role-hero-logo">
                    <img src="/guzurlogo.png" alt="Guzur" />
                  </div>
                  <div className="role-hero-body">
                    <div className="role-hero-badge">
                      <AutoAwesome fontSize="inherit" />
                      <span>{strings.HERO_BADGE}</span>
                    </div>
                    <h1>
                      {strings.HERO_TITLE}
                      <span>{strings.HERO_HIGHLIGHT}</span>
                    </h1>
                    <p>{strings.HERO_BODY}</p>
                  </div>
                  <div className="role-hero-footer">
                    <span>{strings.HERO_FOOTER}</span>
                    <span className="role-hero-dot" />
                  </div>
                </div>
              </section>

              <section className="role-panel">
                <div className="role-panel-inner">
                  <button className="role-back" onClick={() => navigate('/sign-up')}>
                    <West fontSize="small" />
                    {strings.BACK_TO_REGISTER}
                  </button>

                  <div className="role-panel-header">
                    <h2>{strings.HEADING}</h2>
                    <span className="role-accent" />
                    <p>{strings.CHOOSE_ROLE}</p>
                  </div>

                  <div className="role-cards">
                    <button className="role-card" onClick={() => navigate('/sign-up/role/broker')}>
                      <div className="role-card-glow" />
                      <div className="role-card-icon">
                        <WorkOutline fontSize="medium" />
                      </div>
                      <div className="role-card-body">
                        <div className="role-card-tag">
                          <span>{strings.BROKER_TAG}</span>
                          <NorthEast fontSize="small" />
                        </div>
                        <h3>{strings.BROKER}</h3>
                        <p>{strings.BROKER_DESC}</p>
                      </div>
                    </button>

                    <button className="role-card" onClick={() => navigate('/sign-up/role/developer')}>
                      <div className="role-card-glow" />
                      <div className="role-card-icon">
                        <Apartment fontSize="medium" />
                      </div>
                      <div className="role-card-body">
                        <div className="role-card-tag">
                          <span>{strings.DEVELOPER_TAG}</span>
                          <NorthEast fontSize="small" />
                        </div>
                        <h3>{strings.DEVELOPER}</h3>
                        <p>{strings.DEVELOPER_DESC}</p>
                      </div>
                    </button>

                    <button className="role-card" onClick={() => navigate('/sign-up/role/owner')}>
                      <div className="role-card-glow" />
                      <div className="role-card-icon">
                        <HomeOutlined fontSize="medium" />
                      </div>
                      <div className="role-card-body">
                        <div className="role-card-tag">
                          <span>{strings.OWNER_TAG}</span>
                          <NorthEast fontSize="small" />
                        </div>
                        <h3>{strings.OWNER}</h3>
                        <p>{strings.OWNER_DESC}</p>
                      </div>
                    </button>
                  </div>

                  <p className="role-footer-note">{strings.FOOTER_NOTE}</p>
                </div>
              </section>
            </div>
            <Footer />
          </>
        )}
      </Layout>
    )
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      {visible && (
        <>
          <div className="role-form-portal">
            <section className="role-hero">
              <div className="role-hero-media" />
              <div className="role-hero-gradient" />
              <div className="role-hero-content">
                <div className="role-hero-logo">
                  <img src="/guzurlogo.png" alt="Guzur" />
                </div>
                <div className="role-hero-body">
                  <div className="role-hero-badge">
                    <AutoAwesome fontSize="inherit" />
                    <span>{strings.HERO_BADGE}</span>
                  </div>
                  <h1>
                    {strings.HERO_TITLE}
                    <span>{strings.HERO_HIGHLIGHT}</span>
                  </h1>
                  <p>{strings.HERO_BODY}</p>
                </div>
                <div className="role-hero-footer">
                  <span>{strings.HERO_FOOTER}</span>
                  <span className="role-hero-dot" />
                </div>
              </div>
            </section>

            <section className="role-panel">
              <div className="role-panel-inner">
                <button className="role-back" onClick={() => navigate('/sign-up/role')}>
                  <West fontSize="small" />
                  {strings.BACK_TO_ROLES}
                </button>

                <div className="role-panel-header">
                  <h2>{strings.SIGN_UP_AS}</h2>
                  <span className="role-accent" />
                  <p>{strings.SIGN_UP_SUBTITLE}</p>
                </div>

                <form className="role-form" onSubmit={handleSubmit}>
                  <div className="role-field">
                    <label className="required">{commonStrings.FULL_NAME}</label>
                    <div className="role-input">
                      <PersonOutline fontSize="small" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={strings.FULL_NAME_PLACEHOLDER}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="role-grid">
                    <div className="role-field">
                      <label className="required">{commonStrings.EMAIL}</label>
                      <div className={`role-input ${(!emailValid || emailError) ? 'is-error' : ''}`}>
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
                        <span className="role-help error">
                          {(!emailValid && commonStrings.EMAIL_NOT_VALID) || ''}
                          {(emailError && commonStrings.EMAIL_ALREADY_REGISTERED) || ''}
                        </span>
                      )}
                    </div>

                    <div className="role-field">
                      <label className="required">{commonStrings.PHONE}</label>
                      <div className={`role-input ${!phoneValid ? 'is-error' : ''}`}>
                        <PhoneOutlined fontSize="small" />
                        <input
                          type="tel"
                          value={phone}
                          onBlur={handlePhoneBlur}
                          onChange={(e) => {
                            setPhone(e.target.value)
                            if (!e.target.value) {
                              setPhoneValid(true)
                            }
                          }}
                          placeholder={strings.PHONE_PLACEHOLDER}
                          required
                          autoComplete="off"
                        />
                      </div>
                      {!phoneValid && (
                        <span className="role-help error">{commonStrings.PHONE_NOT_VALID}</span>
                      )}
                    </div>
                  </div>

                  <div className="role-grid">
                    <div className="role-field">
                      <label className="required">{commonStrings.PASSWORD}</label>
                      <div className={`role-input ${passwordError ? 'is-error' : ''}`}>
                        <LockOutlined fontSize="small" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            setPasswordsDontMatch(false)
                          }}
                          placeholder={strings.PASSWORD_PLACEHOLDER}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="role-visibility"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? strings.HIDE_PASSWORD : strings.SHOW_PASSWORD}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </button>
                      </div>
                    </div>

                    <div className="role-field">
                      <label className="required">{commonStrings.CONFIRM_PASSWORD}</label>
                      <div className={`role-input ${passwordsDontMatch ? 'is-error' : ''}`}>
                        <LockOutlined fontSize="small" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            setPasswordsDontMatch(false)
                          }}
                          placeholder={strings.CONFIRM_PASSWORD_PLACEHOLDER}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`role-tos ${tosError ? 'is-error' : ''}`}>
                    <label className="role-checkbox">
                      <input type="checkbox" checked={tosChecked} onChange={(e) => {
                        setTosChecked(e.target.checked)
                        if (e.target.checked) {
                          setTosError(false)
                        }
                      }} />
                      <span>{commonStrings.TOS}</span>
                    </label>
                  </div>

                  <div className="role-actions">
                    <button type="submit" className="role-submit">
                      {signUpStrings.SIGN_UP}
                      <ArrowForward fontSize="small" />
                    </button>
                  </div>

                  <div className="role-error">
                    {passwordError && <Error message={commonStrings.PASSWORD_ERROR} />}
                    {passwordsDontMatch && <Error message={commonStrings.PASSWORDS_DONT_MATCH} />}
                    {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
                    {tosError && <Error message={commonStrings.TOS_ERROR} />}
                    {error && <Error message={signUpStrings.SIGN_UP_ERROR} />}
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

export default RoleSignUp
