import React, { useState, useEffect } from 'react'
import { TextFieldVariants } from '@mui/material'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import env from '@/config/env.config'
import * as UserService from '@/services/UserService'
import * as helper from '@/utils/helper'
import MultipleSelect from './MultipleSelect'

interface DeveloperSelectListProps {
  value?: movininTypes.Option
  label?: string
  required?: boolean
  variant?: TextFieldVariants
  onChange?: (values: movininTypes.Option[]) => void
}

const DeveloperSelectList = ({
  value,
  label,
  required,
  variant,
  onChange
}: DeveloperSelectListProps) => {
  const [init, setInit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [developers, setDevelopers] = useState<movininTypes.Option[]>([])
  const [fetch, setFetch] = useState(false)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<movininTypes.Option[]>([])

  useEffect(() => {
    const _value = value ? [value] : []
    if (value && !movininHelper.arrayEqual(selectedOptions, _value)) {
      setSelectedOptions(_value)
    }
  }, [value, selectedOptions])

  const getDevelopers = (users: movininTypes.User[]): movininTypes.Option[] =>
    users.map((user) => {
      const { _id, fullName, avatar } = user
      return { _id: _id as string, name: fullName, image: avatar }
    })

  const fetchData = async (_page: number, _keyword: string, onFetch?: movininTypes.DataEvent<movininTypes.User>) => {
    try {
      setLoading(true)
      const payload: movininTypes.GetUsersBody = {
        user: '',
        types: [movininTypes.UserType.Developer],
      }

      const data = await UserService.getUsers(payload, _keyword, _page, env.PAGE_SIZE)

      const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
      if (!_data) {
        helper.error()
        return
      }

      const optionsList = getDevelopers(_data.resultData)
      const _developers = _page === 1 ? optionsList : [...developers, ...optionsList]

      setDevelopers(_developers)
      setFetch(optionsList.length > 0)

      if (onFetch) {
        onFetch()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (values: movininTypes.Option[]) => {
    if (onChange) {
      onChange(values)
    }
  }

  return (
    <MultipleSelect
      loading={loading}
      label={label || ''}
      callbackFromMultipleSelect={handleChange}
      options={developers}
      selectedOptions={selectedOptions}
      required={required || false}
      multiple={false}
      type={movininTypes.RecordType.User}
      variant={variant || 'standard'}
      ListboxProps={{
        onScroll: (event) => {
          const listboxNode = event.currentTarget
          if (fetch && !loading && listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - env.PAGE_OFFSET) {
            const p = page + 1
            setPage(p)
            fetchData(p, keyword)
          }
        },
      }}
      onFocus={() => {
        if (!init) {
          const p = 1
          setPage(p)
          setDevelopers([])
          fetchData(p, keyword, () => {
            setInit(true)
          })
        }
      }}
      onInputChange={(event) => {
        const _value = (event && event.target && 'value' in event.target && event.target.value as string) || ''

        if (_value !== keyword) {
          setDevelopers([])
          setPage(1)
          setKeyword(_value)
          fetchData(1, _value)
        }
      }}
      onClear={() => {
        setDevelopers([])
        setPage(1)
        setKeyword('')
        setFetch(true)
        fetchData(1, '')
      }}
    />
  )
}

export default DeveloperSelectList
