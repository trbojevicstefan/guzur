import React, { useRef, useState } from 'react'
import * as movininTypes from ':movinin-types'
import * as movininHelper from ':movinin-helper'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/utils/helper'
import Accordion from '@/components/Accordion'
import LeadStatus from './LeadStatus'

import '@/assets/css/status-filter.css'

interface LeadStatusFilterProps {
  className?: string
  collapse?: boolean
  onChange?: (value: movininTypes.LeadStatus[]) => void
}

const statuses = helper.getLeadStatuses()
const allStatuses = statuses.map((status) => status.value)

const LeadStatusFilter = ({
  className,
  collapse,
  onChange
}: LeadStatusFilterProps) => {
  const [checkedStatuses, setCheckedStatuses] = useState<movininTypes.LeadStatus[]>([])
  const [allChecked, setAllChecked] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (_checkedStatuses: movininTypes.LeadStatus[]) => {
    if (onChange) {
      onChange(_checkedStatuses.length === 0 ? allStatuses : movininHelper.clone(_checkedStatuses))
    }
  }

  const handleCheckStatusChange = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLElement>) => {
    const status = e.currentTarget.getAttribute('data-value') as movininTypes.LeadStatus

    if ('checked' in e.currentTarget && e.currentTarget.checked) {
      checkedStatuses.push(status)

      if (checkedStatuses.length === allStatuses.length) {
        setAllChecked(true)
      }
    } else {
      const index = checkedStatuses.findIndex((s) => s === status)
      checkedStatuses.splice(index, 1)

      if (checkedStatuses.length === 0) {
        setAllChecked(false)
      }
    }

    setCheckedStatuses(checkedStatuses)
    handleChange(checkedStatuses)
  }

  const handleUncheckAllChange = () => {
    if (allChecked) {
      refs.current.forEach((checkbox) => {
        if (checkbox) {
          checkbox.checked = false
        }
      })

      setAllChecked(false)
      setCheckedStatuses([])
    } else {
      refs.current.forEach((checkbox) => {
        if (checkbox) {
          checkbox.checked = true
        }
      })

      setAllChecked(true)
      setCheckedStatuses(allStatuses)

      handleChange(allStatuses)
    }
  }

  return (
    (allStatuses.length > 0 && (
      <Accordion title={commonStrings.STATUS} collapse={collapse} className={`${className ? `${className} ` : ''}status-filter`}>
        <ul className="status-list">
          {statuses.map((status, index) => (
            <li key={status.value}>
              <input
                ref={(ref) => {
                  refs.current[index] = ref
                }}
                type="checkbox"
                data-value={status.value}
                className="status-checkbox"
                onChange={handleCheckStatusChange}
              />
              <LeadStatus value={status.value} />
            </li>
          ))}
        </ul>
        <div className="filter-actions">
          <span
            onClick={handleUncheckAllChange}
            className="uncheckall"
            role="button"
            tabIndex={0}
          >
            {allChecked ? commonStrings.UNCHECK_ALL : commonStrings.CHECK_ALL}
          </span>
        </div>
      </Accordion>
    )) || <></>
  )
}

export default LeadStatusFilter
