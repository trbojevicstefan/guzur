import React, { useState } from 'react'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import NotificationList from '@/components/NotificationList'
import { useReveal } from '@/hooks/useMotion'

const Notifications = () => {
  const [user, setUser] = useState<movininTypes.User>()
  const revealRef = useReveal<HTMLDivElement>()

  const onLoad = async (_user?: movininTypes.User) => {
    setUser(_user)
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div ref={revealRef}>
        <NotificationList user={user} />
      </div>
    </Layout>
  )
}

export default Notifications
