import React, { useEffect, useState } from 'react'
import {
  DataGrid,
  GridPaginationModel,
  GridColDef,
  GridRowId,
  GridRenderCellParams
} from '@mui/x-data-grid'
import {
  Tooltip,
  IconButton,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/lead-list'
import * as helper from '@/utils/helper'
import * as LeadService from '@/services/LeadService'
import LeadStatus from './LeadStatus'
import LeadStatusList from './LeadStatusList'
import AssigneeSelectList from './AssigneeSelectList'

import '@/assets/css/lead-list.css'

interface LeadListProps {
  statuses?: movininTypes.LeadStatus[]
  keyword?: string
  checkboxSelection?: boolean
}

const LeadList = ({
  statuses,
  keyword,
  checkboxSelection,
}: LeadListProps) => {
  const [columns, setColumns] = useState<GridColDef<movininTypes.Lead>[]>([])
  const [rows, setRows] = useState<movininTypes.Lead[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [status, setStatus] = useState<movininTypes.LeadStatus>()
  const [assignee, setAssignee] = useState<movininTypes.Option | undefined>()
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: env.PAGE_SIZE,
    page: 0,
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(env.isMobile ? env.BOOKINGS_MOBILE_PAGE_SIZE : env.PAGE_SIZE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!env.isMobile) {
      setPage(paginationModel.page)
      setPageSize(paginationModel.pageSize)
    }
  }, [paginationModel])

  const fetchData = async (_page: number) => {
    try {
      setLoading(true)
      const _pageSize = env.isMobile ? env.BOOKINGS_MOBILE_PAGE_SIZE : pageSize

      const payload: movininTypes.GetLeadsPayload = {
        statuses,
        keyword,
      }

      const data = await LeadService.getLeads(payload, _page + 1, _pageSize)

      const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
      if (!_data) {
        helper.error()
        return
      }
      const totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0

      if (env.isMobile) {
        const _rows = _page === 0 ? _data.resultData : [...rows, ..._data.resultData]
        setRows(_rows)
        setRowCount(totalRecords)
      } else {
        setRows(_data.resultData)
        setRowCount(totalRecords)
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(page)
  }, [page, statuses, keyword]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page === 0) {
      fetchData(0)
    } else {
      const _paginationModel = { ...paginationModel, page: 0 }
      setPaginationModel(_paginationModel)
    }
  }, [pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const getColumns = (): GridColDef<movininTypes.Lead>[] => ([
    {
      field: 'name',
      headerName: strings.NAME,
      flex: 1,
    },
    {
      field: 'email',
      headerName: strings.EMAIL,
      flex: 1,
    },
    {
      field: 'phone',
      headerName: strings.PHONE,
      flex: 1,
    },
    {
      field: 'message',
      headerName: strings.MESSAGE,
      flex: 2,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.Lead, string>) => {
        const text = value || ''
        const truncated = text.length > 80 ? `${text.slice(0, 80)}…` : text
        if (!text) {
          return <span>-</span>
        }
        return (
          <Tooltip title={text} placement="left">
            <span>{truncated}</span>
          </Tooltip>
        )
      },
    },
    {
      field: 'property',
      headerName: strings.PROPERTY,
      flex: 1,
      renderCell: ({ row, value }: GridRenderCellParams<movininTypes.Lead, string>) => {
        const propertyId = typeof row.property === 'string'
          ? row.property
          : (row.property as movininTypes.Property | undefined)?._id
        if (!propertyId || !value) {
          return <span>-</span>
        }
        return (
          <Tooltip title={value} placement="left">
            <Link href={`/property?p=${propertyId}`}>{value}</Link>
          </Tooltip>
        )
      },
      valueGetter: (value: movininTypes.Property | string | undefined) => (
        typeof value === 'string' ? value : (value?.name || value?._id || '')
      ),
    },
    {
      field: 'listingType',
      headerName: strings.LISTING_TYPE,
      flex: 1,
      valueGetter: (value: movininTypes.ListingType | undefined) => helper.getListingType(value),
    },
    {
      field: 'status',
      headerName: strings.STATUS,
      flex: 1,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.Lead, movininTypes.LeadStatus>) => (
        <LeadStatus value={value!} />
      ),
    },
    {
      field: 'assignedTo',
      headerName: strings.ASSIGNED_TO,
      flex: 1,
      renderCell: ({ row, value }: GridRenderCellParams<movininTypes.Lead, string>) => {
        const assignedId = typeof row.assignedTo === 'string' ? row.assignedTo : (row.assignedTo as movininTypes.User)?._id
        return value
          ? <Link href={`/user?u=${assignedId}`}>{value}</Link>
          : <span>-</span>
      },
      valueGetter: (value: movininTypes.User | string) => (
        typeof value === 'string' ? value : (value?.fullName || '')
      ),
    },
    {
      field: 'createdAt',
      headerName: strings.CREATED_AT,
      flex: 1,
      valueGetter: (value: string) => (value ? new Date(value).toLocaleDateString() : ''),
    },
    {
      field: 'action',
      headerName: '',
      sortable: false,
      disableColumnMenu: true,
      renderCell: ({ row }: GridRenderCellParams<movininTypes.Lead>) => {
        const handleDelete = (e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation()
          setSelectedId(row._id || '')
          setOpenDeleteDialog(true)
        }

        const handleEdit = (e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation()
          setSelectedId(row._id || '')
          setAssignee(row.assignedTo ? { _id: (row.assignedTo as movininTypes.User)._id as string, name: (row.assignedTo as movininTypes.User).fullName } : undefined)
          setStatus(row.status)
          setOpenUpdateDialog(true)
        }

        return (
          <div>
            <Tooltip title={commonStrings.UPDATE}>
              <IconButton onClick={handleEdit}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={commonStrings.DELETE}>
              <IconButton onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </div>
        )
      },
      renderHeader: () => (selectedIds.length > 0 ? (
        <div>
          <Tooltip title={strings.UPDATE_SELECTION}>
            <IconButton onClick={() => setOpenUpdateDialog(true)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={strings.DELETE_SELECTION}>
            <IconButton onClick={() => setOpenDeleteDialog(true)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </div>
      ) : (<></>)),
    },
  ])

  useEffect(() => {
    setColumns(getColumns())
  }, [selectedIds, rows]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelUpdate = () => {
    setOpenUpdateDialog(false)
  }

  const handleConfirmUpdate = async () => {
    try {
      const ids = selectedIds.length > 0 ? selectedIds : [selectedId]
      if (!status && !assignee) {
        helper.error()
        return
      }

      const updatePromises = ids.map((id) => LeadService.updateLead({
        _id: id,
        status,
        assignedTo: assignee?._id,
      }))

      const results = await Promise.all(updatePromises)
      if (!results.every((s) => s === 200)) {
        helper.error()
        return
      }

      setOpenUpdateDialog(false)
      setSelectedIds([])
      setSelectedId('')
      fetchData(page)
    } catch (err) {
      helper.error(err)
    }
  }

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false)
    setSelectedId('')
  }

  const handleConfirmDelete = async () => {
    try {
      const ids = selectedIds.length > 0 ? selectedIds : [selectedId]
      const statusCode = await LeadService.deleteLeads(ids)
      if (statusCode !== 200) {
        helper.error()
        return
      }

      if (selectedIds.length > 0) {
        setRows(rows.filter((row) => row._id && !selectedIds.includes(row._id)))
      } else {
        setRows(rows.filter((row) => row._id !== selectedId))
      }

      setOpenDeleteDialog(false)
      setSelectedIds([])
      setSelectedId('')
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <div className="bs-list">
      {env.isMobile ? (
        <>
          {rows.map((lead) => (
            <div key={lead._id} className="lead-detail">
              <div className="lead-detail-title">{strings.NAME}</div>
              <div className="lead-detail-value">{lead.name}</div>
              <div className="lead-detail-title">{strings.PROPERTY}</div>
              <div className="lead-detail-value">
                {!lead.property ? (
                  <span>-</span>
                ) : (typeof lead.property === 'string' ? (
                  <span>{lead.property}</span>
                ) : (
                  <Link href={`/property?p=${lead.property._id}`}>{lead.property.name}</Link>
                ))}
              </div>
              <div className="lead-detail-title">{strings.STATUS}</div>
              <div className="lead-detail-value">
                <LeadStatus value={lead.status} />
              </div>
              <div className="lead-detail-title">{strings.ASSIGNED_TO}</div>
              <div className="lead-detail-value">
                {typeof lead.assignedTo === 'string'
                  ? lead.assignedTo
                  : (lead.assignedTo as movininTypes.User)?.fullName || '-'}
              </div>
              <div className="lead-detail-title">{strings.CREATED_AT}</div>
              <div className="lead-detail-value">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}</div>
              <div>
                <Button
                  variant="contained"
                  className="btn-primary"
                  size="small"
                  onClick={() => {
                    setSelectedId(lead._id || '')
                    setAssignee(lead.assignedTo ? { _id: (lead.assignedTo as movininTypes.User)._id as string, name: (lead.assignedTo as movininTypes.User).fullName } : undefined)
                    setStatus(lead.status)
                    setOpenUpdateDialog(true)
                  }}
                >
                  {commonStrings.UPDATE}
                </Button>
                <Button
                  variant="contained"
                  className="btn-secondary"
                  size="small"
                  onClick={() => {
                    setSelectedId(lead._id || '')
                    setOpenDeleteDialog(true)
                  }}
                >
                  {commonStrings.DELETE}
                </Button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <DataGrid
          checkboxSelection={checkboxSelection}
          getRowId={(row: movininTypes.Lead): GridRowId => row._id as GridRowId}
          columns={columns}
          rows={rows}
          rowCount={rowCount}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { pageSize: env.PAGE_SIZE },
            },
          }}
          pageSizeOptions={[env.PAGE_SIZE, 50, 100]}
          pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          onRowSelectionModelChange={(_selectedIds) => {
            if (_selectedIds.type === 'exclude' && _selectedIds.ids.size === 0) {
              _selectedIds = { type: 'include', ids: new Set(rows.map((row) => row._id as GridRowId)) }
            }
            setSelectedIds(Array.from(new Set(_selectedIds.ids)).map((id) => id.toString()))
          }}
          disableRowSelectionOnClick
          className="lead-grid"
        />
      )}

      <Dialog disableEscapeKeyDown maxWidth="xs" open={openUpdateDialog}>
        <DialogTitle className="dialog-header">{strings.UPDATE_STATUS}</DialogTitle>
        <DialogContent className="bs-update-status">
          <LeadStatusList label={strings.NEW_STATUS} onChange={setStatus} />
          <AssigneeSelectList label={strings.ASSIGN_TO} onChange={(values) => setAssignee(values[0])} />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCancelUpdate} variant="contained" className="btn-secondary">
            {commonStrings.CANCEL}
          </Button>
          <Button onClick={handleConfirmUpdate} variant="contained" className="btn-primary">
            {commonStrings.UPDATE}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog disableEscapeKeyDown maxWidth="xs" open={openDeleteDialog}>
        <DialogTitle className="dialog-header">{commonStrings.CONFIRM_TITLE}</DialogTitle>
        <DialogContent className="dialog-content">
          {selectedIds.length === 0 ? strings.DELETE_LEAD : strings.DELETE_LEADS}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCancelDelete} variant="contained" className="btn-secondary">
            {commonStrings.CANCEL}
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            {commonStrings.DELETE}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default LeadList
