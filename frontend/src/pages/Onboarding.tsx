import React, { useEffect, useState } from 'react'
import {
  OutlinedInput,
  InputLabel,
  FormControl,
  Button,
  Paper,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/onboarding'
import * as UserService from '@/services/UserService'
import Layout from '@/components/Layout'
import Backdrop from '@/components/SimpleBackdrop'
import * as helper from '@/utils/helper'
import { useUserContext, UserContextType } from '@/context/UserContext'

import '@/assets/css/onboarding.css'

const Onboarding = () => {
  const navigate = useNavigate()
  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [user, setLocalUser] = useState<movininTypes.User | null>(null)
  const [company, setCompany] = useState('')
  const [licenseId, setLicenseId] = useState('')
  const [serviceAreas, setServiceAreas] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    if (user) {
      setCompany(user.company || '')
      setLicenseId(user.licenseId || '')
      setServiceAreas((user.serviceAreas || []).join(', '))
      setWebsite(user.website || '')
    }
  }, [user])

  const onLoad = (currentUser?: movininTypes.User) => {
    if (!currentUser) {
      navigate('/sign-in')
      return
    }
    if (![movininTypes.UserType.Broker, movininTypes.UserType.Developer, movininTypes.UserType.Owner].includes(currentUser.type as movininTypes.UserType)) {
      navigate('/')
      return
    }
    const hasOrg = !!(currentUser.primaryOrg && (typeof currentUser.primaryOrg === 'string' || (currentUser.primaryOrg as movininTypes.Organization)?._id))
    if (hasOrg && !currentUser.onboardingCompleted) {
      navigate('/dashboard')
      return
    }
    setLocalUser(currentUser)
    setVisible(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      if (!user?._id) {
        return
      }

      setLoading(true)

      const payload: movininTypes.UpdateUserPayload = {
        _id: user._id as string,
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        fullName: user.fullName || '',
        company: company || undefined,
        licenseId: licenseId || undefined,
        serviceAreas: serviceAreas
          ? serviceAreas.split(',').map((value) => value.trim()).filter(Boolean)
          : undefined,
        website: website || undefined,
        onboardingCompleted: true,
      }

      const updated = await UserService.completeOnboarding(payload)
      if (updated) {
        localStorage.setItem('mi-fe-user', JSON.stringify(updated))
        setLocalUser(updated)
        setUserLoaded(true)
        helper.info(strings.COMPLETE)
        navigate('/dashboard')
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      {visible && (
        <div className="onboarding">
          <Paper className="onboarding-form" elevation={10}>
            <h1 className="onboarding-title">{strings.HEADING}</h1>
            <p className="onboarding-subtitle">{strings.SUBHEADING}</p>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.COMPANY}</InputLabel>
                <OutlinedInput type="text" label={strings.COMPANY} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="off" />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.LICENSE_ID}</InputLabel>
                <OutlinedInput type="text" label={strings.LICENSE_ID} value={licenseId} onChange={(e) => setLicenseId(e.target.value)} autoComplete="off" />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.SERVICE_AREAS}</InputLabel>
                <OutlinedInput
                  type="text"
                  label={strings.SERVICE_AREAS}
                  value={serviceAreas}
                  onChange={(e) => setServiceAreas(e.target.value)}
                  autoComplete="off"
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>{strings.WEBSITE}</InputLabel>
                <OutlinedInput type="text" label={strings.WEBSITE} value={website} onChange={(e) => setWebsite(e.target.value)} autoComplete="off" />
              </FormControl>
              <div className="buttons">
                <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom">
                  {strings.SAVE}
                </Button>
                <Button variant="outlined" color="primary" className="btn-margin-bottom" onClick={() => navigate('/')}>
                  {commonStrings.CANCEL}
                </Button>
              </div>
            </form>
          </Paper>
        </div>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default Onboarding
