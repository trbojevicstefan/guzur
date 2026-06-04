import React from 'react'
import { strings } from '@/lang/cookie-policy'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { useReveal } from '@/hooks/useMotion'

import '@/assets/css/cookie-policy.css'

const ToS = () => {
  const onLoad = () => { }

  const revealRef = useReveal<HTMLDivElement>()

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="cookie-policy" ref={revealRef}>
        <h1 data-reveal>{strings.TITLE}</h1>
        <p data-reveal>{strings.POLICY}</p>
      </div>
      <Footer />
    </Layout>
  )
}

export default ToS
