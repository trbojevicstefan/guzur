import React, { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  VisibilityOutlined,
  ChatBubbleOutline,
  EditOutlined,
  AssignmentTurnedInOutlined,
  ArchiveOutlined,
} from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import { strings as dashboardStrings } from '@/lang/dashboard'
import { strings as commonStrings } from '@/lang/common'
import { strings as listingFormStrings } from '@/lang/listing-form'
import * as helper from '@/utils/helper'
import * as UserService from '@/services/UserService'

import '@/assets/css/listing-table.css'

interface ListingTableProps {
  listings: movininTypes.Property[]
  onEdit?: (listing: movininTypes.Property) => void
  onView?: (listing: movininTypes.Property) => void
  onSubmitReview?: (listing: movininTypes.Property) => void
  onArchive?: (listing: movininTypes.Property) => void
  onMessage?: (listing: movininTypes.Property) => void
}

const ListingTable = ({ listings, onEdit, onView, onSubmitReview, onArchive, onMessage }: ListingTableProps) => {
  const [language, setLanguage] = useState('en')
  const showActions = !!onEdit || !!onView || !!onSubmitReview || !!onArchive || !!onMessage

  useEffect(() => {
    setLanguage(UserService.getLanguage())
  }, [])

  if (!listings.length) {
    return <div className="listing-table-empty">{dashboardStrings.EMPTY_LISTINGS}</div>
  }

  return (
    <Paper className="listing-table">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{dashboardStrings.NAME}</TableCell>
            <TableCell>{commonStrings.LISTING_TYPE}</TableCell>
            <TableCell>{dashboardStrings.STATUS}</TableCell>
            <TableCell>{listingFormStrings.RENT_PRICE}</TableCell>
            <TableCell>{listingFormStrings.SALE_PRICE}</TableCell>
            <TableCell>{dashboardStrings.UPDATED}</TableCell>
            {showActions && <TableCell>{commonStrings.OPTIONS}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing._id}>
              <TableCell>{listing.name}</TableCell>
              <TableCell>{helper.getListingType(listing.listingType)}</TableCell>
              <TableCell>
                <span
                  className={`listing-status status-${(listing.listingStatus ?? movininTypes.ListingStatus.Draft).toLowerCase()}`}
                >
                  {helper.getListingStatus(listing.listingStatus ?? movininTypes.ListingStatus.Draft)}
                </span>
              </TableCell>
              <TableCell>{movininHelper.formatPrice(listing.price, commonStrings.CURRENCY, language)}</TableCell>
              <TableCell>
                {listing.salePrice !== undefined && listing.salePrice !== null
                  ? movininHelper.formatPrice(listing.salePrice, commonStrings.CURRENCY, language)
                  : '-'}
              </TableCell>
              <TableCell>{listing.updatedAt ? new Date(listing.updatedAt).toLocaleDateString() : '-'}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="listing-table-actions">
                    {onView && (
                      <Tooltip title={commonStrings.VIEW} placement="top">
                        <IconButton
                          className="listing-table-action"
                          onClick={() => onView(listing)}
                          aria-label={commonStrings.VIEW}
                          size="small"
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onMessage && (
                      <Tooltip title={commonStrings.SEND_MESSAGE} placement="top">
                        <IconButton
                          className="listing-table-action message"
                          onClick={() => onMessage(listing)}
                          aria-label={commonStrings.SEND_MESSAGE}
                          size="small"
                        >
                          <ChatBubbleOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip title={commonStrings.UPDATE} placement="top">
                        <IconButton
                          className="listing-table-action"
                          onClick={() => onEdit(listing)}
                          aria-label={commonStrings.UPDATE}
                          size="small"
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onSubmitReview && (
                      <Tooltip title={commonStrings.SUBMIT_FOR_REVIEW} placement="top">
                        <IconButton
                          className="listing-table-action"
                          onClick={() => onSubmitReview(listing)}
                          aria-label={commonStrings.SUBMIT_FOR_REVIEW}
                          size="small"
                        >
                          <AssignmentTurnedInOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onArchive && (
                      <Tooltip title={commonStrings.ARCHIVE} placement="top">
                        <IconButton
                          className="listing-table-action"
                          onClick={() => onArchive(listing)}
                          aria-label={commonStrings.ARCHIVE}
                          size="small"
                        >
                          <ArchiveOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

export default ListingTable
