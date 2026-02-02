import React, { useState } from 'react'
import Layout from '@/components/Layout'
import Search from '@/components/Search'
import InfoBox from '@/components/InfoBox'
import * as movininTypes from ':movinin-types'
import { strings } from '@/lang/owners'
import UserList from '@/components/UserList'

import '@/assets/css/owners.css'

const Owners = () => {
  const [keyword, setKeyword] = useState('')
  const [rowCount, setRowCount] = useState(-1)

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const handleOwnerLoad: movininTypes.DataEvent<movininTypes.User> = (data) => {
    if (data) {
      setRowCount(data.rowCount)
    }
  }

  return (
    <Layout strict>
      <div className="owners">
        <div className="col-1">
          <Search className="search" onSubmit={handleSearch} />
          {rowCount > 0 && (
            <InfoBox
              value={`${rowCount} ${rowCount > 1 ? strings.OWNERS : strings.OWNER}`}
              className="owner-count"
            />
          )}
        </div>
        <div className="col-2">
          <h2>{strings.OWNERS}</h2>
          <UserList keyword={keyword} types={[movininTypes.UserType.Owner]} onLoad={handleOwnerLoad} />
        </div>
      </div>
    </Layout>
  )
}

export default Owners
