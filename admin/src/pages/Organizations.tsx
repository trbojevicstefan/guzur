import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import Search from '@/components/Search'
import OrganizationList from '@/components/OrganizationList'
import { strings } from '@/lang/organizations'

import '@/assets/css/organizations.css'

const Organizations = () => {
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<movininTypes.OrganizationType | ''>('')

  const handleSearch = (value: string) => {
    setKeyword(value)
  }

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as movininTypes.OrganizationType | ''
    setType(value)
  }

  const onLoad = () => {
    const queryType = (searchParams.get('type') || '').trim()
    if (Object.values(movininTypes.OrganizationType).includes(queryType as movininTypes.OrganizationType)) {
      setType(queryType as movininTypes.OrganizationType)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="organizations">
        <div className="organizations-sidebar">
          <Search onSubmit={handleSearch} className="search" />
          <FormControl fullWidth className="organizations-filter">
            <InputLabel>{strings.TYPE}</InputLabel>
            <Select value={type} label={strings.TYPE} onChange={handleTypeChange}>
              <MenuItem value="">{strings.ALL_TYPES}</MenuItem>
              <MenuItem value={movininTypes.OrganizationType.Brokerage}>{strings.BROKERAGE}</MenuItem>
              <MenuItem value={movininTypes.OrganizationType.Developer}>{strings.DEVELOPER}</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div className="organizations-content">
          <OrganizationList keyword={keyword} type={type} />
        </div>
      </div>
    </Layout>
  )
}

export default Organizations
