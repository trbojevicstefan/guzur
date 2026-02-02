import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import { strings as dashboardStrings } from '@/lang/dashboard'

const Dashboard = () => {
  const navigate = useNavigate()

  const onLoad = (user?: movininTypes.User) => {
    if (!user) {
      navigate('/sign-in')
      return
    }

    const hasOrg = !!(user.primaryOrg && (typeof user.primaryOrg === 'string' || (user.primaryOrg as movininTypes.Organization)?._id))
    if (!user.onboardingCompleted && !hasOrg) {
      navigate('/onboarding')
      return
    }

    switch (user.type) {
      case movininTypes.UserType.Broker:
        navigate('/dashboard/broker')
        break
      case movininTypes.UserType.Developer:
        navigate('/dashboard/developer')
        break
      case movininTypes.UserType.Owner:
        navigate('/dashboard/owner')
        break
      default:
        navigate('/')
        break
    }
  }

  useEffect(() => {
    document.title = dashboardStrings.DASHBOARD
  }, [])

  return (
    <Layout strict={false} onLoad={onLoad}>
      <div />
    </Layout>
  )
}

export default Dashboard
