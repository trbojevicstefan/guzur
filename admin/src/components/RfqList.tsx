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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import {
  Edit as EditIcon
} from '@mui/icons-material'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/rfq-list'
import * as helper from '@/utils/helper'
import * as RfqService from '@/services/RfqService'
import RfqStatus from './RfqStatus'
import RfqStatusList from './RfqStatusList'
import AssigneeSelectList from './AssigneeSelectList'

import '@/assets/css/lead-list.css'

interface RfqListProps {
  statuses?: movininTypes.RfqStatus[]
  keyword?: string
  checkboxSelection?: boolean
}

const RfqList = ({
  statuses,
  keyword,
  checkboxSelection,
}: RfqListProps) => {
  const [columns, setColumns] = useState<GridColDef<movininTypes.RfqRequest>[]>([])
  const [rows, setRows] = useState<movininTypes.RfqRequest[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false)
  const [status, setStatus] = useState<movininTypes.RfqStatus>()
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
      const statusFilter = statuses && statuses.length === 1 ? statuses[0] : undefined
      const data = await RfqService.getRfqs(_page + 1, _pageSize, statusFilter, keyword)
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

  const getColumns = (): GridColDef<movininTypes.RfqRequest>[] => ([
    { field: 'name', headerName: strings.NAME, flex: 1 },
    { field: 'email', headerName: strings.EMAIL, flex: 1 },
    { field: 'phone', headerName: strings.PHONE, flex: 1 },
    { field: 'location', headerName: strings.LOCATION, flex: 1 },
    {
      field: 'listingType',
      headerName: strings.LISTING_TYPE,
      flex: 1,
      valueGetter: (value: movininTypes.ListingType) => (value ? helper.getListingType(value) : '-'),
    },
    {
      field: 'propertyType',
      headerName: strings.PROPERTY_TYPE,
      flex: 1,
      valueGetter: (value: movininTypes.PropertyType) => (value ? helper.getPropertyType(value) : '-'),
    },
    { field: 'bedrooms', headerName: strings.BEDROOMS, flex: 1 },
    { field: 'bathrooms', headerName: strings.BATHROOMS, flex: 1 },
    { field: 'budget', headerName: strings.BUDGET, flex: 1 },
    {
      field: 'message',
      headerName: strings.MESSAGE,
      flex: 1,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.RfqRequest, string>) => (
        <Tooltip title={value || ''} placement="left">
          <span>{value || '-'}</span>
        </Tooltip>
      ),
    },
    {
      field: 'status',
      headerName: strings.STATUS,
      flex: 1,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.RfqRequest, movininTypes.RfqStatus>) => (
        value ? <RfqStatus value={value} /> : <span>-</span>
      ),
    },
    {
      field: 'assignedTo',
      headerName: strings.ASSIGNED_TO,
      flex: 1,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.RfqRequest, movininTypes.User | string>) => (
        <span>{typeof value === 'string' ? value : (value?.fullName || '-')}</span>
      ),
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
      renderCell: ({ row }: GridRenderCellParams<movininTypes.RfqRequest>) => {
        const handleEdit = (e: React.MouseEvent<HTMLElement>) => {
          e.stopPropagation()
          setSelectedId(row._id || '')
          if (row.assignedTo) {
            if (typeof row.assignedTo === 'string') {
              setAssignee({ _id: row.assignedTo, name: row.assignedTo })
            } else {
              setAssignee({ _id: row.assignedTo._id as string, name: row.assignedTo.fullName })
            }
          } else {
            setAssignee(undefined)
          }
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

      const updatePromises = ids.map((id) => RfqService.updateRfq({
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

  return (
    <div className="bs-list">
      {env.isMobile ? (
        <>
          {rows.length === 0 && !loading && <div>{strings.EMPTY}</div>}
          {rows.map((rfq) => (
            <div key={rfq._id} className="lead-detail">
              <div className="lead-detail-title">{strings.NAME}</div>
              <div className="lead-detail-value">{rfq.name}</div>
              <div className="lead-detail-title">{strings.STATUS}</div>
              <div className="lead-detail-value">
                {rfq.status ? <RfqStatus value={rfq.status} /> : '-'}
              </div>
              <div className="lead-detail-title">{strings.CREATED_AT}</div>
              <div className="lead-detail-value">{rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : ''}</div>
              <div>
                <Button
                  variant="contained"
                  className="btn-primary"
                  size="small"
                  onClick={() => {
                    setSelectedId(rfq._id || '')
                    if (rfq.assignedTo) {
                      if (typeof rfq.assignedTo === 'string') {
                        setAssignee({ _id: rfq.assignedTo, name: rfq.assignedTo })
                      } else {
                        setAssignee({ _id: rfq.assignedTo._id as string, name: rfq.assignedTo.fullName })
                      }
                    } else {
                      setAssignee(undefined)
                    }
                    setStatus(rfq.status)
                    setOpenUpdateDialog(true)
                  }}
                >
                  {commonStrings.UPDATE}
                </Button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <DataGrid
          checkboxSelection={checkboxSelection}
          getRowId={(row: movininTypes.RfqRequest): GridRowId => row._id as GridRowId}
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
          <RfqStatusList label={strings.NEW_STATUS} onChange={setStatus} />
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
    </div>
  )
}

export default RfqList
