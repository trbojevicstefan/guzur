import React, { useEffect, useState } from 'react'
import { Button } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import * as movininTypes from ':movinin-types'
import { strings } from '@/lang/developments'
import { strings as commonStrings } from '@/lang/common'
import Search from '@/components/Search'
import DevelopmentList from '@/components/DevelopmentList'
import DevelopmentStatusList from '@/components/DevelopmentStatusList'
import DeveloperSelectList from '@/components/DeveloperSelectList'
import * as UserService from '@/services/UserService'
import env from '@/config/env.config'

import '@/assets/css/developments.css'

const Developments = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState<movininTypes.DevelopmentStatus>()
  const [developer, setDeveloper] = useState<movininTypes.Option>()
  const [keyword, setKeyword] = useState('')

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const developerId = params.get('developer')
    if (developerId) {
      UserService.getUser(developerId)
        .then((dev) => {
          if (dev) {
            setDeveloper({ _id: dev._id as string, name: dev.fullName || '', image: dev.avatar || '' })
          }
        })
        .catch(() => undefined)
    }
  }, [location.search])

  return (
    <Layout strict>
      <div className="developments">
        <div className="col-1">
          <Button variant="contained" className="btn-primary cl-new-development" size="small" onClick={() => navigate('/create-development')}>
            {strings.NEW_DEVELOPMENT}
          </Button>
          <Search onSubmit={handleSearch} className="search" />
          <div className="development-filter">
            <DevelopmentStatusList
              label={commonStrings.STATUS}
              includeAll
              onChange={(_status) => setStatus((_status as string) ? _status : undefined)}
            />
          </div>
          <div className="development-filter">
            <DeveloperSelectList
              label={strings.DEVELOPER}
              value={developer}
              onChange={(values) => setDeveloper(values[0])}
            />
          </div>
        </div>
        <div className="col-2">
          <h2>{strings.DEVELOPMENTS}</h2>
          <DevelopmentList
            status={status}
            developer={developer?._id}
            keyword={keyword}
            checkboxSelection={!env.isMobile}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Developments
