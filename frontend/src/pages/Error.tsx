import React from 'react'
import { Link } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { useReveal } from '@/hooks/useMotion'

const Error = ({ style }: { style?: React.CSSProperties }) => {
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <div className="msg" style={style || {}} ref={revealRef}>
      <h2 data-reveal>{commonStrings.GENERIC_ERROR}</h2>
      <Link href="/" data-reveal>{commonStrings.GO_TO_HOME}</Link>
    </div>
  )
}

export default Error
