import React, { useEffect, useRef, useState } from 'react'
import {
  AutoAwesome,
  Schedule,
  PlaceOutlined,
  EmailOutlined,
  EditOutlined,
  Send,
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import validator from 'validator'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/contact-form'
import * as UserService from '@/services/UserService'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import * as helper from '@/utils/helper'

import '@/assets/css/contact.css'

const Contact = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType

  const [user, setUser] = useState<movininTypes.User>()
  const [email, setEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [emailValid, setEmailValid] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const prefillDone = useRef(false)

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true)
      setEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    if (prefillDone.current) {
      return
    }
    const state = location.state as { subject?: string; message?: string } | null
    const params = new URLSearchParams(location.search)
    const subjectValue = state?.subject || params.get('subject') || ''
    const messageValue = state?.message || params.get('message') || ''

    if (subjectValue && !subject) {
      setSubject(subjectValue)
    }
    if (messageValue && !message) {
      setMessage(messageValue)
    }
    if (subjectValue || messageValue) {
      prefillDone.current = true
    }
  }, [location.search, location.state, message, subject])

  const onLoad = (_user?: movininTypes.User) => {
    setUser(_user)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)

    if (!e.target.value) {
      setEmailValid(true)
    }
  }

  const validateEmail = (_email?: string) => {
    if (_email) {
      const valid = validator.isEmail(_email)
      setEmailValid(valid)
      return valid
    }
    setEmailValid(true)
    return false
  }

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    await validateEmail(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      setSending(true)
      e.preventDefault()

      const _emailValid = await validateEmail(email)
      if (!_emailValid) {
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
        helper.error('reCAPTCHA error')
        return
      }

      const payload: movininTypes.SendEmailPayload = {
        from: email,
        to: env.CONTACT_EMAIL,
        subject,
        message,
        isContactForm: true,
      }
      const status = await UserService.sendEmail(payload)

      if (status === 200) {
        if (!isAuthenticated) {
          setEmail('')
        }
        setSubject('')
        setMessage('')
        helper.info(strings.MESSAGE_SENT)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="contact-portal">
        <section className="contact-hero">
          <div className="contact-hero-media" />
          <div className="contact-hero-gradient" />
          <div className="contact-hero-content">
            <div className="contact-hero-logo">
              <img src="/guzurlogo.png" alt="Guzur" />
            </div>

            <div className="contact-hero-body">
              <div className="contact-hero-badge">
                <AutoAwesome fontSize="inherit" />
                <span>{strings.CONCIERGE_BADGE}</span>
              </div>
              <h1>
                {strings.CONTACT_TITLE}
                <span>{strings.CONTACT_HIGHLIGHT}</span>
              </h1>
              <p>{strings.CONTACT_BODY}</p>

              <div className="contact-hero-info">
                <div className="contact-hero-info-item">
                  <div className="contact-hero-info-icon">
                    <Schedule fontSize="small" />
                  </div>
                  <div>
                    <p>{strings.CONTACT_INFO_ONE_LABEL}</p>
                    <span>{strings.CONTACT_INFO_ONE_VALUE}</span>
                  </div>
                </div>
                <div className="contact-hero-info-item">
                  <div className="contact-hero-info-icon">
                    <PlaceOutlined fontSize="small" />
                  </div>
                  <div>
                    <p>{strings.CONTACT_INFO_TWO_LABEL}</p>
                    <span>{strings.CONTACT_INFO_TWO_VALUE}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-hero-footer">
              <span>{strings.CONTACT_FOOTER}</span>
              <span className="contact-hero-dot" />
            </div>
          </div>
        </section>

        <section className="contact-panel">
          <div className="contact-panel-inner">
            <div className="contact-panel-header">
              <h2>{strings.CONTACT_HEADER}</h2>
              <span className="contact-accent" />
              <p>{strings.CONTACT_SUBTITLE}</p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-field">
                <label className="required">{commonStrings.EMAIL}</label>
                <div className={`contact-input ${!emailValid ? 'is-error' : ''}`}>
                  <EmailOutlined fontSize="small" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder={strings.EMAIL_PLACEHOLDER}
                    required
                    autoComplete="off"
                    disabled={isAuthenticated}
                  />
                </div>
                {!emailValid && (
                  <span className="contact-help error">{commonStrings.EMAIL_NOT_VALID}</span>
                )}
              </div>

              <div className="contact-field">
                <label className="required">{strings.SUBJECT}</label>
                <div className="contact-input">
                  <EditOutlined fontSize="small" />
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={strings.SUBJECT_PLACEHOLDER}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="contact-field">
                <label className="required">{strings.MESSAGE}</label>
                <div className="contact-textarea">
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={strings.MESSAGE_PLACEHOLDER}
                    required
                  />
                </div>
              </div>

              <div className="contact-actions">
                <button type="submit" className="contact-submit" disabled={sending}>
                  {sending ? strings.SENDING : strings.SEND}
                  <Send fontSize="small" />
                </button>
                <button type="button" className="contact-cancel" onClick={() => navigate('/')}
                >
                  {commonStrings.CANCEL}
                </button>
              </div>
            </form>

            <p className="contact-footer-note">{strings.CONTACT_NOTE}</p>
          </div>
        </section>
      </div>
      <Footer />
    </Layout>
  )
}

export default Contact
