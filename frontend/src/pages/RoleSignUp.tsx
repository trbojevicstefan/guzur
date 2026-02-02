import React, { useState } from 'react'
import {
  OutlinedInput,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Checkbox,
  Link
} from '@mui/material'
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
import PasswordInput from '@/components/PasswordInput'
import Footer from '@/components/Footer'

import '@/assets/css/signup.css'
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
            <div className="signup role-signup">
              <Paper className="signup-form role-signup-form" elevation={10}>
                <h1 className="signup-form-title">{strings.HEADING}</h1>
                <p className="role-signup-subtitle">{strings.CHOOSE_ROLE}</p>
                <div className="role-signup-actions">
                  <Button variant="outlined" onClick={() => navigate('/sign-up/role/broker')}>
                    {strings.BROKER}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/sign-up/role/developer')}>
                    {strings.DEVELOPER}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/sign-up/role/owner')}>
                    {strings.OWNER}
                  </Button>
                </div>
              </Paper>
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
          <div className="signup role-signup">
            <Paper className="signup-form" elevation={10}>
              <h1 className="signup-form-title">{strings.SIGN_UP_AS}</h1>
              <form onSubmit={handleSubmit}>
                <div>
                  <FormControl fullWidth margin="dense">
                    <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
                    <OutlinedInput type="text" label={commonStrings.FULL_NAME} value={fullName} required onChange={(e) => setFullName(e.target.value)} autoComplete="off" />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                    <OutlinedInput
                      type="text"
                      label={commonStrings.EMAIL}
                      error={!emailValid || emailError}
                      value={email}
                      onBlur={handleEmailBlur}
                      onChange={handleEmailChange}
                      required
                      autoComplete="off"
                    />
                    <FormHelperText error={!emailValid || emailError}>
                      {(!emailValid && commonStrings.EMAIL_NOT_VALID) || ''}
                      {(emailError && commonStrings.EMAIL_ALREADY_REGISTERED) || ''}
                    </FormHelperText>
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <InputLabel className="required">{commonStrings.PHONE}</InputLabel>
                    <OutlinedInput
                      type="text"
                      label={commonStrings.PHONE}
                      error={!phoneValid}
                      value={phone}
                      onBlur={handlePhoneBlur}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        if (!e.target.value) {
                          setPhoneValid(true)
                        }
                      }}
                      required
                      autoComplete="off"
                    />
                    <FormHelperText error={!phoneValid}>{(!phoneValid && commonStrings.PHONE_NOT_VALID) || ''}</FormHelperText>
                  </FormControl>

                  <PasswordInput
                    label={commonStrings.PASSWORD}
                    variant="outlined"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordsDontMatch(false)
                    }}
                    required
                    inputProps={{
                      autoComplete: 'new-password',
                      form: {
                        autoComplete: 'off',
                      },
                    }}
                  />

                  <PasswordInput
                    label={commonStrings.CONFIRM_PASSWORD}
                    variant="outlined"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setPasswordsDontMatch(false)
                    }}
                    required
                    inputProps={{
                      autoComplete: 'new-password',
                      form: {
                        autoComplete: 'off',
                      },
                    }}
                  />

                  <div className="signup-tos">
                    <table>
                      <tbody>
                        <tr>
                          <td aria-label="tos">
                            <Checkbox checked={tosChecked} onChange={(e) => {
                              setTosChecked(e.target.checked)
                              if (e.target.checked) {
                                setTosError(false)
                              }
                            }} color="primary" />
                          </td>
                          <td>
                            <Link href="/tos" target="_blank" rel="noreferrer">
                              {commonStrings.TOS}
                            </Link>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="buttons">
                    <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom">
                      {signUpStrings.SIGN_UP}
                    </Button>
                    <Button variant="outlined" color="primary" className="btn-margin-bottom" onClick={() => navigate('/')}>
                      {commonStrings.CANCEL}
                    </Button>
                  </div>
                </div>
                <div className="form-error">
                  {passwordError && <Error message={commonStrings.PASSWORD_ERROR} />}
                  {passwordsDontMatch && <Error message={commonStrings.PASSWORDS_DONT_MATCH} />}
                  {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
                  {tosError && <Error message={commonStrings.TOS_ERROR} />}
                  {error && <Error message={signUpStrings.SIGN_UP_ERROR} />}
                </div>
              </form>
            </Paper>
          </div>
          <Footer />
        </>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default RoleSignUp
