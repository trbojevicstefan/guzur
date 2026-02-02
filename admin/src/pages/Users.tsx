import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings } from '@/lang/users'
import * as helper from '@/utils/helper'
import UserTypeFilter from '@/components/UserTypeFilter'
import Search from '@/components/Search'
import UserList from '@/components/UserList'

import '@/assets/css/users.css'

const Users = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [user, setUser] = useState<movininTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [types, setTypes] = useState<movininTypes.UserType[]>([])
  const [keyword, setKeyword] = useState('')

  const handleUserTypeFilterChange = (newTypes: movininTypes.UserType[]) => {
    setTypes(newTypes)
  }

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const onLoad = (_user?: movininTypes.User) => {
    const _admin = helper.admin(_user)
    const queryTypes = (searchParams.get('types') || searchParams.get('type') || '')
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
    const queryTypeList = queryTypes.length > 0
      ? helper.expandUserTypes(queryTypes as movininTypes.UserType[])
      : []
    const _types = _admin
      ? (queryTypeList.length > 0
        ? queryTypeList
        : helper.expandUserTypes(helper.getUserTypes().map((userType) => userType.value)))
      : helper.expandUserTypes([movininTypes.UserType.Broker, movininTypes.UserType.User])

    setUser(_user)
    setAdmin(_admin)
    setTypes(_types)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="users">
          <div className="col-1">
            <div className="div.col-1-container">
              <Search onSubmit={handleSearch} className="search" />

              {admin
                && (
                  <UserTypeFilter
                    className="user-type-filter"
                    onChange={handleUserTypeFilterChange}
                  />
                )}

              <Button variant="contained" className="btn-primary new-user" size="small" onClick={() => navigate('/create-user')}>
                {strings.NEW_USER}
              </Button>
            </div>
          </div>
          <div className="col-2">
            <UserList
              user={user}
              types={types}
              keyword={keyword}
              checkboxSelection={!env.isMobile && admin}
              hideDesktopColumns={env.isMobile}
            />
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Users
