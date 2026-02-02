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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import * as movininTypes from ':movinin-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/developments'
import * as helper from '@/utils/helper'
import * as DevelopmentService from '@/services/DevelopmentService'

import '@/assets/css/development-list.css'

interface DevelopmentListProps {
  status?: movininTypes.DevelopmentStatus
  developer?: string
  keyword?: string
  checkboxSelection?: boolean
}

const DevelopmentList = ({
  status,
  developer,
  keyword,
  checkboxSelection,
}: DevelopmentListProps) => {
  const navigate = useNavigate()
  const [columns, setColumns] = useState<GridColDef<movininTypes.Development>[]>([])
  const [rows, setRows] = useState<movininTypes.Development[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [selectedId, setSelectedId] = useState('')
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
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
      const payload: movininTypes.GetDevelopmentsPayload = {
        status,
        developer,
        keyword,
      }
      const data = await DevelopmentService.getDevelopments(payload, keyword || '', _page + 1, _pageSize)
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
  }, [page, status, developer, keyword]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page === 0) {
      fetchData(0)
    } else {
      const _paginationModel = { ...paginationModel, page: 0 }
      setPaginationModel(_paginationModel)
    }
  }, [pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    try {
      if (!selectedId) {
        return
      }
      const statusCode = await DevelopmentService.deleteDevelopment(selectedId)
      if (statusCode === 200) {
        fetchData(page)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setOpenDeleteDialog(false)
      setSelectedId('')
    }
  }

  const getColumns = (): GridColDef<movininTypes.Development>[] => ([
    {
      field: 'name',
      headerName: strings.NAME,
      flex: 1,
      renderCell: ({ row }: GridRenderCellParams<movininTypes.Development, string>) => (
        <Tooltip title={row.name} placement="top">
          <span>{row.name}</span>
        </Tooltip>
      )
    },
    {
      field: 'developer',
      headerName: strings.DEVELOPER,
      flex: 1,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.Development, movininTypes.User | string>) => {
        if (!value) {
          return null
        }
        if (typeof value === 'object') {
          return value.fullName || value.email || value._id
        }
        return value
      }
    },
    {
      field: 'status',
      headerName: strings.STATUS,
      flex: 0.7,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.Development, movininTypes.DevelopmentStatus>) => (
        <span>{helper.getDevelopmentStatus(value)}</span>
      )
    },
    {
      field: 'unitsCount',
      headerName: strings.UNITS,
      flex: 0.5,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.Development, number>) => (
        <span>{value ?? '-'}</span>
      )
    },
    {
      field: 'updatedAt',
      headerName: strings.UPDATED,
      flex: 0.8,
      renderCell: ({ value }: GridRenderCellParams<movininTypes.Development, Date>) => (
        <span>{value ? new Date(value).toLocaleDateString() : '-'}</span>
      )
    },
    {
      field: 'action',
      headerName: commonStrings.OPTIONS,
      sortable: false,
      flex: 0.6,
      renderCell: ({ row }: GridRenderCellParams<movininTypes.Development>) => (
        <div className="list-actions-cell">
          <Tooltip title={commonStrings.VIEW} placement="top">
            <IconButton
              size="small"
              className="btn-view"
              onClick={() => navigate('/development', { state: { developmentId: row._id } })}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={commonStrings.UPDATE} placement="top">
            <IconButton
              size="small"
              className="btn-edit"
              onClick={() => navigate('/update-development', { state: { developmentId: row._id } })}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={commonStrings.DELETE} placement="top">
            <IconButton
              size="small"
              className="btn-delete"
              onClick={() => {
                setSelectedId(row._id as string)
                setOpenDeleteDialog(true)
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </div>
      )
    }
  ])

  useEffect(() => {
    setColumns(getColumns())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        pageSizeOptions={[env.PAGE_SIZE, env.BOOKINGS_MOBILE_PAGE_SIZE]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={setPaginationModel}
        loading={loading}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick
        getRowId={(row: movininTypes.Development): GridRowId => row._id as GridRowId}
      />

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>{commonStrings.CONFIRM_TITLE}</DialogTitle>
        <DialogContent>
          {commonStrings.CONFIRM}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>{commonStrings.CANCEL}</Button>
          <Button onClick={handleDelete} variant="contained" color="error">{commonStrings.DELETE}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DevelopmentList
