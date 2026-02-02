import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import * as movininTypes from ':movinin-types'
import { strings as dashboardStrings } from '@/lang/dashboard'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'

import '@/assets/css/lead-table.css'

interface LeadTableProps {
  leads: movininTypes.Lead[]
}

const LeadTable = ({ leads }: LeadTableProps) => {
  if (!leads.length) {
    return <div className="lead-table-empty">{dashboardStrings.EMPTY_LEADS}</div>
  }

  return (
    <Paper className="lead-table">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{commonStrings.PROPERTY}</TableCell>
            <TableCell>{commonStrings.FULL_NAME}</TableCell>
            <TableCell>{commonStrings.EMAIL}</TableCell>
            <TableCell>{commonStrings.PHONE}</TableCell>
            <TableCell>{commonStrings.STATUS}</TableCell>
            <TableCell>{commonStrings.CREATED}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead._id}>
              <TableCell>
                {typeof lead.property === 'object' ? lead.property.name : lead.property}
              </TableCell>
              <TableCell>{lead.name}</TableCell>
              <TableCell>{lead.email || '-'}</TableCell>
              <TableCell>{lead.phone || '-'}</TableCell>
              <TableCell>{helper.getLeadStatus(lead.status)}</TableCell>
              <TableCell>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

export default LeadTable
