import React from 'react'
import { strings } from '@/lang/tos'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { useReveal } from '@/hooks/useMotion'

import '@/assets/css/tos.css'

const ToS = () => {
  const onLoad = () => { }

  const revealRef = useReveal<HTMLDivElement>()

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="tos" ref={revealRef}>
        <h1 data-reveal>{strings.TITLE}</h1>
        <p data-reveal>{strings.TOS}</p>
      </div>
      <Footer />
    </Layout>
  )
}

export default ToS
