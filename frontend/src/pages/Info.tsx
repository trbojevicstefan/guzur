import React from 'react'
import { Link } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { useReveal } from '@/hooks/useMotion'

interface InfoProps {
  className?: string
  message: string
  hideLink?: boolean
  style?: React.CSSProperties
}

const Info = ({
  className,
  message,
  hideLink,
  style
}: InfoProps) => {
  const revealRef = useReveal<HTMLDivElement>()

  return (
    <div style={style || {}} className={`${className ? `${className} ` : ''}msg`} ref={revealRef}>
      <p data-reveal>{message}</p>
      {!hideLink && <Link href="/" data-reveal>{commonStrings.GO_TO_HOME}</Link>}
    </div>
  )
}

export default Info
