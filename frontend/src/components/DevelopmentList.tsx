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

import '@/assets/css/development-list.css'

interface DevelopmentListLabels {
  EMPTY_DEVELOPMENTS: string
  NAME: string
  STATUS: string
  UNITS: string
  UPDATED: string
  LOCATION: string
  DEVELOPER: string
}

interface DevelopmentListProps {
  developments: movininTypes.Development[]
  showLocation?: boolean
  showDeveloper?: boolean
  labels?: DevelopmentListLabels
  onSelect?: (development: movininTypes.Development) => void
}

const DevelopmentList = ({
  developments,
  showLocation,
  showDeveloper,
  labels,
  onSelect,
}: DevelopmentListProps) => {
  const listLabels = labels || {
    EMPTY_DEVELOPMENTS: dashboardStrings.EMPTY_DEVELOPMENTS,
    NAME: dashboardStrings.NAME,
    STATUS: dashboardStrings.STATUS,
    UNITS: dashboardStrings.UNITS,
    UPDATED: dashboardStrings.UPDATED,
    LOCATION: dashboardStrings.LOCATION || commonStrings.LOCATION,
    DEVELOPER: dashboardStrings.DEVELOPER || commonStrings.DEVELOPER,
  }
  if (!developments.length) {
    return <div className="development-list-empty">{listLabels.EMPTY_DEVELOPMENTS}</div>
  }

  return (
    <Paper className="development-list">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{listLabels.NAME}</TableCell>
            {showLocation && <TableCell>{listLabels.LOCATION}</TableCell>}
            {showDeveloper && <TableCell>{listLabels.DEVELOPER}</TableCell>}
            <TableCell>{listLabels.STATUS}</TableCell>
            <TableCell>{listLabels.UNITS}</TableCell>
            <TableCell>{listLabels.UPDATED}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {developments.map((development) => (
            <TableRow
              key={development._id}
              className={`development-list-row${onSelect ? ' clickable' : ''}`}
              onClick={onSelect ? () => onSelect(development) : undefined}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onKeyDown={onSelect ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(development)
                }
              } : undefined}
            >
              <TableCell>{development.name}</TableCell>
              {showLocation && <TableCell>{development.location || '-'}</TableCell>}
              {showDeveloper && <TableCell>{typeof development.developer === 'object' ? development.developer.fullName : '-'}</TableCell>}
              <TableCell>{helper.getDevelopmentStatus(development.status) || '-'}</TableCell>
              <TableCell>{development.unitsCount ?? '-'}</TableCell>
              <TableCell>{development.updatedAt ? new Date(development.updatedAt).toLocaleDateString() : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

export default DevelopmentList
