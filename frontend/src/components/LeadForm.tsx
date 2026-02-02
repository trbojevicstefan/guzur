import React, { useEffect, useState } from 'react'
import {
  OutlinedInput,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material'
import validator from 'validator'
import * as movininTypes from ':movinin-types'
import { strings as commonStrings } from '@/lang/common'
import { strings as leadStrings } from '@/lang/lead-form'
import * as UserService from '@/services/UserService'
import * as LeadService from '@/services/LeadService'
import * as helper from '@/utils/helper'

import '@/assets/css/lead-form.css'

interface LeadFormProps {
  propertyId: string
  listingType: movininTypes.ListingType
  className?: string
}

const LeadForm = ({ propertyId, listingType, className }: LeadFormProps) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [emailValid, setEmailValid] = useState(true)
  const [phoneValid, setPhoneValid] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const user = UserService.getCurrentUser()
    if (user) {
      setName(user.fullName || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
    }
  }, [])

  const validateEmail = (_email?: string) => {
    if (_email) {
      const valid = validator.isEmail(_email)
      setEmailValid(valid)
      return valid
    }
    setEmailValid(true)
    return false
  }

  const validatePhone = (_phone?: string) => {
    if (_phone) {
      const valid = validator.isMobilePhone(_phone, 'any')
      setPhoneValid(valid)
      return valid
    }
    setPhoneValid(true)
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      setSending(true)
      e.preventDefault()

      const _emailValid = await validateEmail(email)
      const _phoneValid = await validatePhone(phone)
      if (!_emailValid || !_phoneValid || !name) {
        helper.error(null, commonStrings.FIX_ERRORS)
        return
      }

      const payload: movininTypes.CreateLeadPayload = {
        property: propertyId,
        listingType,
        name,
        email,
        phone,
        message,
        source: 'frontend',
      }

      const lead = await LeadService.createLead(payload)
      if (lead) {
        setMessage('')
        helper.info(leadStrings.SENT)
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
    <Paper className={`${className ? `${className} ` : ''}lead-form`} elevation={6}>
      <h2 className="lead-form-title">{leadStrings.HEADING}</h2>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="dense">
          <InputLabel className="required">{leadStrings.NAME}</InputLabel>
          <OutlinedInput
            type="text"
            label={leadStrings.NAME}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel className="required">{leadStrings.EMAIL}</InputLabel>
          <OutlinedInput
            type="text"
            label={leadStrings.EMAIL}
            error={!emailValid}
            value={email}
            onBlur={(e) => validateEmail(e.target.value)}
            onChange={(e) => {
              setEmail(e.target.value)
              if (!e.target.value) {
                setEmailValid(true)
              }
            }}
            required
            autoComplete="off"
          />
          <FormHelperText error={!emailValid}>
            {(!emailValid && commonStrings.EMAIL_NOT_VALID) || ''}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel>{leadStrings.PHONE}</InputLabel>
          <OutlinedInput
            type="text"
            label={leadStrings.PHONE}
            error={!phoneValid}
            value={phone}
            onBlur={(e) => validatePhone(e.target.value)}
            onChange={(e) => {
              setPhone(e.target.value)
              if (!e.target.value) {
                setPhoneValid(true)
              }
            }}
            autoComplete="off"
          />
          <FormHelperText error={!phoneValid}>
            {(!phoneValid && commonStrings.PHONE_NOT_VALID) || ''}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth margin="dense">
          <InputLabel className="required">{leadStrings.MESSAGE}</InputLabel>
          <OutlinedInput
            type="text"
            label={leadStrings.MESSAGE}
            onChange={(e) => setMessage(e.target.value)}
            autoComplete="off"
            value={message}
            required
            multiline
            minRows={5}
            maxRows={6}
          />
        </FormControl>

        <div className="buttons">
          <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom btn" size="small" disabled={sending}>
            {
              sending
                ? <CircularProgress color="inherit" size={24} />
                : leadStrings.SEND
            }
          </Button>
        </div>
      </form>
    </Paper>
  )
}

export default LeadForm
