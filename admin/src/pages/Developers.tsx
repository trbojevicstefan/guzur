import React, { useState } from 'react'
import Layout from '@/components/Layout'
import Search from '@/components/Search'
import InfoBox from '@/components/InfoBox'
import * as movininTypes from ':movinin-types'
import { strings } from '@/lang/developers'
import DeveloperList from '@/components/DeveloperList'

import '@/assets/css/developers.css'

const Developers = () => {
  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleDeveloperLoad: movininTypes.DataEvent<movininTypes.User> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  return (
    <Layout strict>
      <div className="developers">
        <div className="col-1">
          <Search className="search" onSubmit={handleSearch} />
          {rowCount > 0 && (
            <InfoBox
              value={`${rowCount} ${rowCount > 1 ? strings.DEVELOPERS : strings.DEVELOPER}`}
              className="developer-count"
            />
          )}
        </div>
        <div className="col-2">
          <h2>{strings.DEVELOPERS}</h2>
          <DeveloperList keyword={keyword} onLoad={handleDeveloperLoad} />
        </div>
      </div>
    </Layout>
  )
}

export default Developers
