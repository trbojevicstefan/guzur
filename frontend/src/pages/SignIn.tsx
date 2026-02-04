import React, { useState } from 'react'
import {
  MailOutline,
  LockOutlined,
  Visibility,
  VisibilityOff,
  ArrowForward,
  AutoAwesome,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import { strings as commonStrings } from '@/lang/common'
import { strings as suStrings } from '@/lang/sign-up'
import { strings } from '@/lang/sign-in'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import Error from '@/components/Error'
import Layout from '@/components/Layout'
import SocialLogin from '@/components/SocialLogin'
import Footer from '@/components/Footer'

import '@/assets/css/signin.css'

const SignIn = () => {
  const navigate = useNavigate()

  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [blacklisted, setBlacklisted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [stayConnected, setStayConnected] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLElement>) => {
    try {
      e.preventDefault()

      const data: movininTypes.SignInPayload = {
        email,
        password,
        stayConnected: UserService.getStayConnected()
      }

      const res = await UserService.signin(data)

      if (res.status === 200) {
        if (res.data.blacklisted) {
          await UserService.signout(false)
          setError(false)
          setBlacklisted(true)
        } else {
          setError(false)

          const user = await UserService.getUser(res.data._id)
          setUser(user)
          setUserLoaded(true)
        }
      } else {
        setError(true)
        setBlacklisted(false)
      }
    } catch {
      setError(true)
      setBlacklisted(false)
    }
  }

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const onLoad = async (user?: movininTypes.User) => {
    UserService.setStayConnected(false)
    setStayConnected(false)

    if (user) {
      const params = new URLSearchParams(window.location.search)

      if (params.has('from')) {
        const from = params.get('from')
        if (from === 'checkout') {
          navigate('/checkout', {
            state: {
              propertyId: params.get('p'),
              locationId: params.get('l'),
              from: new Date(Number(params.get('f'))),
              to: new Date(Number(params.get('t'))),
            }
          })
        } else {
          navigate('/')
        }
      } else {
        navigate('/')
      }
    } else {
      setVisible(true)
    }
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      {visible && (
        <>
          <div className="signin-portal">
            <section className="signin-hero">
              <div className="signin-hero-media" />
              <div className="signin-hero-gradient" />
              <div className="signin-hero-content">
                <div className="signin-hero-logo">
                  <img src="/guzurlogo.png" alt="Guzur" />
                </div>

                <div className="signin-hero-body">
                  <div className="signin-hero-badge">
                    <AutoAwesome fontSize="inherit" />
                    <span>{strings.MEMBER_ACCESS}</span>
                  </div>
                  <h1>
                    {strings.WELCOME_TITLE}
                    <span>{strings.WELCOME_HIGHLIGHT}</span>
                  </h1>
                  <p>{strings.WELCOME_BODY}</p>

                  <div className="signin-hero-trust">
                    <span>{strings.SECURE}</span>
                    <span>{strings.ENCRYPTED}</span>
                    <span>{strings.VERIFIED}</span>
                  </div>
                </div>

                <div className="signin-hero-footer">
                  <span>{strings.PORTAL_FOOTER}</span>
                  <span className="signin-hero-dot" />
                </div>
              </div>
            </section>

            <section className="signin-panel">
              <div className="signin-panel-card">
                <div className="signin-panel-header">
                  <h2>{strings.SIGN_IN_HEADING}</h2>
                  <span className="signin-accent" />
                  <p>{strings.SIGN_IN_SUBTITLE}</p>
                </div>

                <form onSubmit={handleSubmit} className="signin-form">
                  <div className="signin-field">
                    <label>{commonStrings.EMAIL}</label>
                    <div className="signin-input">
                      <MailOutline fontSize="small" />
                      <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder={strings.EMAIL_PLACEHOLDER}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="signin-field">
                    <label>{commonStrings.PASSWORD}</label>
                    <div className="signin-input">
                      <LockOutlined fontSize="small" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        onKeyDown={handlePasswordKeyDown}
                        placeholder={strings.PASSWORD_PLACEHOLDER}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="signin-visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? strings.HIDE_PASSWORD : strings.SHOW_PASSWORD}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </button>
                    </div>
                  </div>

                  <div className="signin-meta">
                    <label className="signin-checkbox">
                      <input
                        type="checkbox"
                        checked={stayConnected}
                        onChange={(event) => {
                          const checked = event.currentTarget.checked
                          setStayConnected(checked)
                          UserService.setStayConnected(checked)
                        }}
                      />
                      <span>{strings.STAY_CONNECTED}</span>
                    </label>
                    <button
                      type="button"
                      className="signin-forgot"
                      onClick={() => navigate('/forgot-password')}
                    >
                      {strings.RESET_PASSWORD}
                    </button>
                  </div>

                  <button type="submit" className="signin-submit">
                    {strings.SIGN_IN}
                    <ArrowForward fontSize="small" />
                  </button>

                  <SocialLogin
                    className="signin-social"
                    variant="button"
                    separatorLabel={strings.OR_CONTINUE_WITH}
                    googleLabel={strings.GOOGLE_ACCOUNT}
                    onSignInError={() => {
                      setError(true)
                      setBlacklisted(false)
                    }}
                    onBlackListed={() => {
                      setError(false)
                      setBlacklisted(true)
                    }}
                  />

                  <div className="signin-register">
                    <span>{strings.NO_ACCOUNT}</span>
                    <button type="button" onClick={() => navigate('/sign-up')}>
                      {suStrings.SIGN_UP}
                    </button>
                  </div>

                  <div className="signin-error">
                    {error && <Error message={strings.ERROR_IN_SIGN_IN} />}
                    {blacklisted && <Error message={strings.IS_BLACKLISTED} />}
                  </div>
                </form>
              </div>
            </section>
          </div>

          <Footer />
        </>
      )}
    </Layout>
  )
}

export default SignIn
