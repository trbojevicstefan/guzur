import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FormControlLabel,
  Switch,
} from '@mui/material'
import {
  PersonOutline,
  MailOutline,
  PhoneOutlined,
  CalendarMonth,
  PlaceOutlined,
  ExpandMore,
  CameraAlt,
  LockOutlined,
  Save,
  CheckCircle,
} from '@mui/icons-material'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import Layout from '@/components/Layout'
import LocationSelectList from '@/components/LocationSelectList'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/settings'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import Backdrop from '@/components/SimpleBackdrop'
import DatePicker from '@/components/DatePicker'
import Avatar from '@/components/Avatar'
import * as helper from '@/utils/helper'
import Footer from '@/components/Footer'

import '@/assets/css/settings.css'

const Settings = () => {
  const navigate = useNavigate()

  const { user, setUser } = useUserContext() as UserContextType
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<movininTypes.Option | undefined>(undefined)
  const [bio, setBio] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [birthDate, setBirthDate] = useState<Date>()
  const [birthDateValid, setBirthDateValid] = useState(true)
  const [phoneValid, setPhoneValid] = useState(true)
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(false)

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value)
  }

  const validatePhone = (_phone: string) => {
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

  const handleBioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBio(e.target.value)
  }

  const handleEmailNotificationsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (user && user._id) {
        setEnableEmailNotifications(e.target.checked)

        const _user = movininHelper.clone(user) as movininTypes.User
        _user.enableEmailNotifications = e.target.checked

        const payload: movininTypes.UpdateEmailNotificationsPayload = {
          _id: user._id,
          enableEmailNotifications: _user.enableEmailNotifications
        }
        const status = await UserService.updateEmailNotifications(payload)

        if (status === 200) {
          setUser(_user)
          helper.info(strings.SETTINGS_UPDATED)
        }
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const onBeforeUpload = () => {
    setLoading(true)
  }

  const onAvatarChange = (_user: movininTypes.User) => {
    setUser(_user)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()

      if (!user || !user._id) {
        helper.error()
        return
      }

      const _phoneValid = validatePhone(phone)
      if (!_phoneValid) {
        return
      }

      const _birthDateValid = validateBirthDate(birthDate)
      if (!_birthDateValid) {
        return
      }

      const data: movininTypes.UpdateUserPayload = {
        _id: user._id,
        fullName,
        birthDate,
        phone,
        location,
        bio,
      }

      const status = await UserService.updateUser(data)

      if (status === 200) {
        helper.info(strings.SETTINGS_UPDATED)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const onLoad = (_user?: movininTypes.User) => {
    if (_user) {
      setUser(_user)
      setFullName(_user.fullName)
      setPhone(_user.phone || '')
      setBirthDate(_user && _user.birthDate ? new Date(_user.birthDate) : undefined)
      setLocation(_user.location || '')
      setSelectedLocation(undefined)
      setBio(_user.bio || '')
      setEnableEmailNotifications(_user.enableEmailNotifications ?? true)
      setVisible(true)
      setLoading(false)
    }
  }

  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()

  return (
    <Layout onLoad={onLoad} strict>
      {visible && user && (
        <>
          <div className="settings-portal">
            <div className="settings-header">
              {user.verified && (
                <span className="settings-verified">
                  <CheckCircle fontSize="small" />
                  {strings.VERIFIED_ACCOUNT}
                </span>
              )}
              <h1>{strings.PROFILE_TITLE}</h1>
              <p>{strings.PROFILE_SUBTITLE}</p>
            </div>

            <div className="settings-card">
              <div className="settings-card-inner">
                <div className="settings-avatar-row">
                  <div className="settings-avatar">
                    <Avatar
                      loggedUser={user}
                      user={user}
                      size="large"
                      readonly={false}
                      onBeforeUpload={onBeforeUpload}
                      onChange={onAvatarChange}
                      color="disabled"
                      className="settings-avatar-img"
                    />
                    <button type="button" className="settings-avatar-button">
                      <CameraAlt fontSize="small" />
                    </button>
                  </div>
                  <div className="settings-avatar-meta">
                    <h3>{user.fullName}</h3>
                    <p>{strings.MEMBER_SINCE.replace('{year}', String(memberSince))}</p>
                    <button type="button" className="settings-avatar-link">{strings.CHANGE_AVATAR}</button>
                  </div>
                </div>

                <form className="settings-form" onSubmit={handleSubmit}>
                  <div className="settings-section">
                    <div className="settings-section-header">
                      <span className="settings-section-index">01</span>
                      <span className="settings-section-title">{strings.SECTION_PERSONAL}</span>
                      <div className="settings-section-line" />
                    </div>

                    <div className="settings-field">
                      <label>{commonStrings.FULL_NAME}</label>
                      <div className="settings-input">
                        <PersonOutline fontSize="small" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={handleFullNameChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="settings-grid">
                      <div className="settings-field">
                        <label>{commonStrings.EMAIL}</label>
                        <div className="settings-input is-disabled">
                          <MailOutline fontSize="small" />
                          <input type="email" value={user.email} disabled />
                        </div>
                      </div>
                      <div className="settings-field">
                        <label>{commonStrings.PHONE}</label>
                        <div className={`settings-input ${!phoneValid ? 'is-error' : ''}`}>
                          <PhoneOutlined fontSize="small" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            required
                          />
                        </div>
                        {!phoneValid && (
                          <span className="settings-help error">{commonStrings.PHONE_NOT_VALID}</span>
                        )}
                      </div>
                    </div>

                    <div className="settings-grid">
                      <div className="settings-field">
                        <label>{commonStrings.BIRTH_DATE}</label>
                        <div className={`settings-date ${!birthDateValid ? 'is-error' : ''}`}>
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
                            language={user.language}
                          />
                        </div>
                        {!birthDateValid && (
                          <span className="settings-help error">{commonStrings.BIRTH_DATE_NOT_VALID}</span>
                        )}
                      </div>
                      <div className="settings-field">
                        <label>{commonStrings.LOCATION}</label>
                        <div className="settings-select">
                          <PlaceOutlined fontSize="small" />
                          <LocationSelectList
                            label={commonStrings.LOCATION}
                            variant="outlined"
                            value={selectedLocation as movininTypes.Location}
                            onChange={(values) => {
                              const selected = values[0]
                              setSelectedLocation(selected)
                              setLocation(selected?.name || selected?._id || '')
                            }}
                          />
                          <ExpandMore className="settings-select-arrow" />
                        </div>
                      </div>
                    </div>

                    <div className="settings-field">
                      <label>{commonStrings.BIO}</label>
                      <div className="settings-textarea">
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={handleBioChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-header">
                      <span className="settings-section-index">02</span>
                      <span className="settings-section-title">{strings.SECTION_SECURITY}</span>
                      <div className="settings-section-line" />
                    </div>

                    <div className="settings-security">
                      <div>
                        <h4>{strings.SECURITY_TITLE}</h4>
                        <p>{strings.SECURITY_SUBTITLE}</p>
                      </div>
                      <button type="button" onClick={() => navigate('/change-password')}>
                        <LockOutlined fontSize="small" />
                        {commonStrings.RESET_PASSWORD}
                      </button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section-header">
                      <span className="settings-section-index">03</span>
                      <span className="settings-section-title">{strings.SECTION_NOTIFICATIONS}</span>
                      <div className="settings-section-line" />
                    </div>
                    <div className="settings-notifications">
                      <div>
                        <h4>{strings.NOTIFICATIONS_TITLE}</h4>
                        <p>{strings.NOTIFICATIONS_SUBTITLE}</p>
                      </div>
                      <FormControlLabel
                        control={<Switch checked={enableEmailNotifications} onChange={handleEmailNotificationsChange} />}
                        label={strings.SETTINGS_EMAIL_NOTIFICATIONS}
                      />
                    </div>
                  </div>

                  <div className="settings-actions">
                    <button type="submit" className="settings-save">
                      {strings.UPDATE_PROFILE}
                      <Save fontSize="small" />
                    </button>
                    <button type="button" className="settings-cancel" onClick={() => navigate('/')}
                    >
                      {commonStrings.CANCEL}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="settings-footer-note">
              {strings.FOOTER_NOTE}
            </div>
          </div>

          <Footer />
        </>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default Settings
