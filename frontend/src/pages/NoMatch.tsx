import React from 'react'
import { Link } from '@mui/material'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/no-match'
import Layout from '@/components/Layout'
import { useReveal } from '@/hooks/useMotion'

interface NoMatchProps {
  hideHeader?: boolean
}

const NoMatch = ({ hideHeader }: NoMatchProps) => {
  const revealRef = useReveal<HTMLDivElement>()

  const noMatch = () => (
    <div className="msg" ref={revealRef}>
      <h2 data-reveal>{strings.NO_MATCH}</h2>
      <p data-reveal>
        <Link href="/">{commonStrings.GO_TO_HOME}</Link>
      </p>
    </div>
  )

  return hideHeader ? noMatch() : <Layout strict={false}>{noMatch()}</Layout>
}

export default NoMatch
