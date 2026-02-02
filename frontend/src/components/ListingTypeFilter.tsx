import React from 'react'
import * as movininTypes from ':movinin-types'
import { strings as commonStrings } from '@/lang/common'
import Accordion from './Accordion'
import ListingTypeSelect from './ListingTypeSelect'

import '@/assets/css/listing-type-filter.css'

interface ListingTypeFilterProps {
  className?: string
  value?: movininTypes.ListingType
  onChange?: (value: movininTypes.ListingType) => void
}

const ListingTypeFilter = ({
  className,
  value,
  onChange,
}: ListingTypeFilterProps) => (
  <Accordion title={commonStrings.LISTING_TYPE} className={`${className ? `${className} ` : ''}listing-type-filter`}>
    <div className="listing-type-filter-select">
      <ListingTypeSelect
        label={commonStrings.LISTING_TYPE}
        value={value}
        variant="standard"
        onChange={onChange}
      />
    </div>
  </Accordion>
)

export default ListingTypeFilter
