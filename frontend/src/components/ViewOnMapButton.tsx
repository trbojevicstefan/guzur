import React from 'react'
import { Fullscreen as FullscreenIcon } from '@mui/icons-material'
import { strings } from '@/lang/view-on-map-button'

import '@/assets/css/view-on-map-button.css'

interface ViewOnMapButtonProps {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void
}

const ViewOnMapButton = ({ onClick }: ViewOnMapButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="view-on-map"
    aria-label={strings.VIEW_ON_MAP}
    title={strings.VIEW_ON_MAP}
  >
    <FullscreenIcon />
  </button>
)

export default ViewOnMapButton
