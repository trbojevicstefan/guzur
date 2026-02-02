import React, { useState } from 'react'
import Layout from '@/components/Layout'
import * as movininTypes from ':movinin-types'
import { strings } from '@/lang/rfqs'
import RfqList from '@/components/RfqList'
import Search from '@/components/Search'
import RfqStatusFilter from '@/components/RfqStatusFilter'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

import '@/assets/css/bookings.css'

const Rfqs = () => {
  const [statuses, setStatuses] = useState<movininTypes.RfqStatus[]>(
    helper.getRfqStatuses().map((status) => status.value)
  )
  const [keyword, setKeyword] = useState('')

  const handleStatusFilterChange = (_statuses: movininTypes.RfqStatus[]) => {
    setStatuses(_statuses)
  }

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  return (
    <Layout strict>
      <div className="bookings">
        <div className="col-1">
          <Search onSubmit={handleSearch} className="search" />
          <RfqStatusFilter onChange={handleStatusFilterChange} className="cl-status-filter" />
        </div>
        <div className="col-2">
          <h2>{strings.HEADING}</h2>
          <RfqList statuses={statuses} keyword={keyword} checkboxSelection={!env.isMobile} />
        </div>
      </div>
    </Layout>
  )
}

export default Rfqs
