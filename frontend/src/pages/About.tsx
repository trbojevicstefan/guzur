import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { strings } from '@/lang/about'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import { useReveal } from '@/hooks/useMotion'

import '@/assets/css/about.css'

const About = () => {
  const navigate = useNavigate()
  const revealRef = useReveal<HTMLDivElement>()

  const onLoad = () => { }

  return (
    <Layout onLoad={onLoad} strict={false}>
      <div className="about" ref={revealRef}>
        <h1 data-reveal>{strings.TITLE1}</h1>
        <h2 data-reveal>{strings.SUBTITLE1}</h2>
        <p data-reveal>{strings.CONTENT1}</p>

        <h1 data-reveal>{strings.TITLE2}</h1>
        <h2 data-reveal>{strings.SUBTITLE2}</h2>
        <p data-reveal>{strings.CONTENT2}</p>

        <Button
          variant="contained"
          className="btn-primary"
          aria-label="Find deal"
          onClick={() => navigate('/')}
          data-reveal
        >
          {strings.FIND_DEAL}
        </Button>
      </div>

      <Footer />
    </Layout>
  )
}

export default About
