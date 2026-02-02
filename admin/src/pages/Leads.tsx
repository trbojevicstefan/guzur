import React, { useState } from 'react'
import Layout from '@/components/Layout'
import * as movininTypes from ':movinin-types'
import { strings } from '@/lang/leads'
import LeadList from '@/components/LeadList'
import Search from '@/components/Search'
import LeadStatusFilter from '@/components/LeadStatusFilter'
import env from '@/config/env.config'
import * as helper from '@/utils/helper'

import '@/assets/css/bookings.css'

const Leads = () => {
  const [statuses, setStatuses] = useState<movininTypes.LeadStatus[]>(
    helper.getLeadStatuses().map((status) => status.value)
  )
  const [keyword, setKeyword] = useState('')

  const handleStatusFilterChange = (_statuses: movininTypes.LeadStatus[]) => {
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
          <LeadStatusFilter onChange={handleStatusFilterChange} className="cl-status-filter" />
        </div>
        <div className="col-2">
          <h2>{strings.LEADS}</h2>
          <LeadList statuses={statuses} keyword={keyword} checkboxSelection={!env.isMobile} />
        </div>
      </div>
    </Layout>
  )
}

export default Leads
