import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowBack,
  ArrowForward,
  AutoAwesome,
  Business,
  CheckCircleOutline,
  GraphicEq,
  LocationOn,
  MicOff,
  Troubleshoot,
  VolumeUp,
} from '@mui/icons-material'
import validator from 'validator'
import * as movininTypes from ':movinin-types'
import Footer from '@/components/Footer'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/concierge'
import * as LeadService from '@/services/LeadService'
import * as helper from '@/utils/helper'

import '@/assets/css/concierge.css'

type ConciergeStep = 'hero' | 'form' | 'voice'
type VoiceStatus = 'idle' | 'connecting' | 'active' | 'error'
type VoiceActivity = 'idle' | 'listening' | 'thinking' | 'speaking'
type VoiceLanguage = 'en' | 'eg'

interface FormErrors {
  name?: string
  email?: string
  phone?: string
}

interface TranscriptEntry {
  role: 'user' | 'model'
  text: string
  timestamp: number
}

interface IntakeData {
  name: string
  email: string
  phone: string
  interest: 'buy' | 'rent' | 'sell'
}

const PHONE_PATTERN = /^[0-9()+\-\s]{7,20}$/

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'string') {
    return err
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message?: string }).message || fallback)
  }
  return fallback
}

const resolveLiveSocketBase = () => {
  try {
    const apiUrl = new URL(env.API_HOST)
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${apiUrl.host}`
  } catch {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }
}

const downsampleTo16k = (data: Float32Array, inputSampleRate: number): Int16Array => {
  if (inputSampleRate === 16000) {
    const direct = new Int16Array(data.length)
    for (let index = 0; index < data.length; index += 1) {
      direct[index] = Math.max(-1, Math.min(1, data[index])) * 32767
    }
    return direct
  }

  const ratio = inputSampleRate / 16000
  const nextLength = Math.round(data.length / ratio)
  const pcm16 = new Int16Array(nextLength)

  for (let index = 0; index < nextLength; index += 1) {
    const sample = data[Math.round(index * ratio)] || 0
    pcm16[index] = Math.max(-1, Math.min(1, sample)) * 32767
  }

  return pcm16
}

const toBase64 = (bytes: Uint8Array) => {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

const Concierge = () => {
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null)
  const keepAliveGainRef = useRef<GainNode | null>(null)
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([])
  const nextPlaybackStartRef = useRef(0)

  const [step, setStep] = useState<ConciergeStep>('hero')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState<'buy' | 'rent' | 'sell'>('buy')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false)
  const [leadId, setLeadId] = useState('')

  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const [voiceActivity, setVoiceActivity] = useState<VoiceActivity>('idle')
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('en')
  const [voiceError, setVoiceError] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [showDebugLogs, setShowDebugLogs] = useState(false)
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const formData = useMemo<IntakeData>(
    () => ({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      interest,
    }),
    [name, email, phone, interest]
  )

  const statusLabel = useMemo(() => {
    switch (voiceStatus) {
      case 'connecting':
        return strings.CALL_CONNECTING
      case 'active':
        return strings.CALL_ACTIVE
      case 'error':
        return strings.CALL_ERROR
      default:
        return strings.CALL_READY
    }
  }, [voiceStatus])

  const statusClass = useMemo(() => {
    if (voiceStatus === 'active') {
      return 'is-active'
    }
    if (voiceStatus === 'error') {
      return 'is-error'
    }
    if (voiceStatus === 'connecting') {
      return 'is-connecting'
    }
    return ''
  }, [voiceStatus])

  const appendDebugLog = useCallback((message: string) => {
    const line = `[${new Date().toISOString()}] ${message}`
    setDebugLogs((previous) => [...previous.slice(-119), line])
  }, [])

  const addTranscript = useCallback((role: 'user' | 'model', text: string) => {
    const nextText = text.trim()
    if (!nextText) {
      return
    }
    setTranscripts((previous) => [...previous.slice(-29), { role, text: nextText, timestamp: Date.now() }])
  }, [])

  const stopPlayback = useCallback(() => {
    playbackSourcesRef.current.forEach((source) => {
      try {
        source.stop()
      } catch {
        // no-op
      }
    })
    playbackSourcesRef.current = []
    if (audioContextRef.current) {
      nextPlaybackStartRef.current = audioContextRef.current.currentTime
    }
    setIsSpeaking(false)
  }, [])

  const stopMicrophoneCapture = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect()
      processorNodeRef.current.onaudioprocess = null
      processorNodeRef.current = null
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }

    if (keepAliveGainRef.current) {
      keepAliveGainRef.current.disconnect()
      keepAliveGainRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    analyserRef.current = null
    setMicLevel(0)
  }, [])

  const closeSession = useCallback(() => {
    stopMicrophoneCapture()
    stopPlayback()

    const ws = wsRef.current
    wsRef.current = null
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  }, [stopMicrophoneCapture, stopPlayback])

  const teardownAudioContext = useCallback(async () => {
    const context = audioContextRef.current
    audioContextRef.current = null
    if (context && context.state !== 'closed') {
      try {
        await context.close()
      } catch {
        // no-op
      }
    }
  }, [])

  const playPcmChunk = useCallback(
    async (base64: string) => {
      if (!audioContextRef.current) {
        return
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
      }

      const pcm = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(pcm.length)
      for (let index = 0; index < pcm.length; index += 1) {
        float32[index] = pcm[index] / 32768
      }

      const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000)
      buffer.getChannelData(0).set(float32)

      const source = audioContextRef.current.createBufferSource()
      source.buffer = buffer
      source.connect(audioContextRef.current.destination)

      const now = audioContextRef.current.currentTime
      if (nextPlaybackStartRef.current < now) {
        nextPlaybackStartRef.current = now + 0.05
      }

      source.start(nextPlaybackStartRef.current)
      nextPlaybackStartRef.current += buffer.duration
      playbackSourcesRef.current.push(source)

      setIsSpeaking(true)
      setVoiceActivity('speaking')

      source.onended = () => {
        playbackSourcesRef.current = playbackSourcesRef.current.filter((current) => current !== source)
        const currentTime = audioContextRef.current?.currentTime ?? 0
        if (nextPlaybackStartRef.current <= currentTime + 0.1) {
          setIsSpeaking(false)
          setVoiceActivity('listening')
        }
      }
    },
    []
  )

  const startMicrophoneCapture = useCallback(
    async (socket: WebSocket) => {
      if (!audioContextRef.current) {
        throw new Error(strings.AUDIO_CONTEXT_FAILED)
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const source = audioContextRef.current.createMediaStreamSource(stream)
      sourceNodeRef.current = source

      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
      const gain = audioContextRef.current.createGain()
      gain.gain.value = 0

      source.connect(processor)
      processor.connect(gain)
      gain.connect(audioContextRef.current.destination)

      processor.onaudioprocess = (event) => {
        if (isMuted || socket.readyState !== WebSocket.OPEN) {
          return
        }

        const channelData = event.inputBuffer.getChannelData(0)
        const pcm16 = downsampleTo16k(channelData, event.inputBuffer.sampleRate)
        const base64 = toBase64(new Uint8Array(pcm16.buffer))

        socket.send(JSON.stringify({ audio: base64 }))
      }

      processorNodeRef.current = processor
      keepAliveGainRef.current = gain

      socket.send(JSON.stringify({ text: strings.OPENING_PROMPT }))
      appendDebugLog(strings.LOG_AUDIO_READY)
    },
    [appendDebugLog, isMuted]
  )

  const handleSocketMessage = useCallback(
    async (payload: string) => {
      let data: Record<string, any>
      try {
        data = JSON.parse(payload)
      } catch {
        appendDebugLog(strings.LOG_MESSAGE_PARSE_FAILED)
        return
      }

      if (data.type === 'ready') {
        setVoiceStatus('active')
        setVoiceActivity('listening')
        appendDebugLog(strings.LOG_AGENT_READY)

        if (wsRef.current) {
          try {
            await startMicrophoneCapture(wsRef.current)
          } catch (err) {
            const message = getErrorMessage(err, strings.MIC_PERMISSION_DENIED)
            appendDebugLog(`${strings.LOG_MIC_FAILED}: ${message}`)
            setVoiceStatus('error')
            setVoiceError(message)
            helper.error(err, message)
          }
        }
        return
      }

      if (data.error) {
        const message = String(data.error)
        setVoiceStatus('error')
        setVoiceError(message)
        appendDebugLog(`${strings.LOG_SERVER_ERROR}: ${message}`)
        return
      }

      const serverContent = data.serverContent as Record<string, any> | undefined
      if (!serverContent) {
        return
      }

      if (serverContent.modelTurn?.parts && Array.isArray(serverContent.modelTurn.parts)) {
        for (const part of serverContent.modelTurn.parts) {
          if (part?.inlineData?.data) {
            await playPcmChunk(String(part.inlineData.data))
          }
          if (part?.text) {
            addTranscript('model', String(part.text))
          }
        }
      }

      if (serverContent.outputTranscription?.text) {
        addTranscript('model', String(serverContent.outputTranscription.text))
      }

      if (serverContent.inputTranscription?.text) {
        addTranscript('user', String(serverContent.inputTranscription.text))
        setVoiceActivity('thinking')
      }

      if (serverContent.interrupted) {
        stopPlayback()
        setVoiceActivity('listening')
        appendDebugLog(strings.LOG_INTERRUPTED)
      }
    },
    [addTranscript, appendDebugLog, playPcmChunk, startMicrophoneCapture, stopPlayback]
  )

  const connectVoice = useCallback(async () => {
    if (voiceStatus === 'connecting' || voiceStatus === 'active') {
      return
    }

    setVoiceStatus('connecting')
    setVoiceActivity('idle')
    setVoiceError('')
    setTranscripts([])
    setDebugLogs([])

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(strings.MIC_UNSUPPORTED)
      }

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      const baseUrl = resolveLiveSocketBase()
      const socketUrl = `${baseUrl}/live?lang=${voiceLanguage}&name=${encodeURIComponent(formData.name || 'Guest')}`
      const socket = new WebSocket(socketUrl)
      wsRef.current = socket

      socket.onopen = () => {
        appendDebugLog(`${strings.LOG_SOCKET_OPEN}: ${socketUrl}`)
      }

      socket.onmessage = (event) => {
        void handleSocketMessage(String(event.data))
      }

      socket.onerror = () => {
        setVoiceStatus('error')
        setVoiceError(strings.SOCKET_ERROR)
        appendDebugLog(strings.LOG_SOCKET_ERROR)
      }

      socket.onclose = (event) => {
        stopMicrophoneCapture()
        stopPlayback()
        wsRef.current = null

        if (voiceStatus !== 'error') {
          setVoiceStatus('idle')
          setVoiceActivity('idle')
          setIsSpeaking(false)
        }

        appendDebugLog(`${strings.LOG_SOCKET_CLOSED}: ${event.code}`)
      }
    } catch (err) {
      const message = getErrorMessage(err, strings.SOCKET_CONNECT_FAILED)
      setVoiceStatus('error')
      setVoiceError(message)
      helper.error(err, message)
    }
  }, [
    appendDebugLog,
    formData.name,
    handleSocketMessage,
    stopMicrophoneCapture,
    stopPlayback,
    voiceLanguage,
    voiceStatus,
  ])

  const endSession = useCallback(() => {
    closeSession()
    setVoiceStatus('idle')
    setVoiceActivity('idle')
    setVoiceError('')
    setIsSpeaking(false)
  }, [closeSession])

  const validateForm = useCallback(() => {
    const nextErrors: FormErrors = {}
    if (!formData.name) {
      nextErrors.name = strings.FIELD_REQUIRED
    }
    if (!formData.email) {
      nextErrors.email = strings.FIELD_REQUIRED
    } else if (!validator.isEmail(formData.email)) {
      nextErrors.email = strings.INVALID_EMAIL
    }
    if (!formData.phone) {
      nextErrors.phone = strings.FIELD_REQUIRED
    } else if (!PHONE_PATTERN.test(formData.phone)) {
      nextErrors.phone = strings.INVALID_PHONE
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [formData.email, formData.name, formData.phone])

  const handleCreateLead = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!validateForm()) {
        helper.error(null, commonStrings.FIX_ERRORS)
        return
      }

      setIsLeadSubmitting(true)
      try {
        const payload: movininTypes.CreateLeadPayload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          source: 'concierge-live',
          message: `${strings.LEAD_MESSAGE_PREFIX}: ${interest}`,
        }

        const lead = await LeadService.createLead(payload)
        const nextLeadId = String((lead as movininTypes.Lead)?._id || '')
        setLeadId(nextLeadId)
        setStep('voice')
        helper.info(strings.LEAD_CAPTURE_SUCCESS)
      } catch (err) {
        helper.error(err, strings.LEAD_CREATE_FAILED)
      } finally {
        setIsLeadSubmitting(false)
      }
    },
    [formData.email, formData.name, formData.phone, interest, validateForm]
  )

  const handleCopyLogs = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(debugLogs.join('\n'))
      helper.info(strings.LOG_COPIED)
    } catch (err) {
      helper.error(err)
    }
  }, [debugLogs])

  useEffect(() => {
    const node = transcriptRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [transcripts, debugLogs, showDebugLogs])

  useEffect(() => {
    if (step !== 'voice') {
      endSession()
    }
  }, [endSession, step])

  useEffect(
    () => () => {
      closeSession()
      void teardownAudioContext()
    },
    [closeSession, teardownAudioContext]
  )

  useEffect(() => {
    let animationId = 0

    const tick = () => {
      if (analyserRef.current && voiceStatus === 'active' && !isMuted) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(data)
        const average = data.reduce((sum, value) => sum + value, 0) / data.length
        const level = Math.min(100, Math.round(average * 0.9))
        setMicLevel(level)
        if (level > 10 && voiceActivity === 'idle') {
          setVoiceActivity('listening')
        }
      } else {
        setMicLevel(0)
      }

      animationId = window.requestAnimationFrame(tick)
    }

    animationId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(animationId)
    }
  }, [isMuted, voiceActivity, voiceStatus])

  return (
    <Layout strict={false}>
      <div className="concierge-page">
        <div className="concierge-shell-v2">
          {step === 'hero' && (
            <section className="concierge-step concierge-hero-v2">
              <div className="concierge-hero-overlay" />
              <div className="concierge-hero-content">
                <img src="/guzurlogo.png" alt={env.WEBSITE_NAME} className="concierge-logo-v2" />
                <span className="concierge-pill">{strings.PAGE_BADGE}</span>
                <h1>{strings.HERO_TITLE}</h1>
                <p>{strings.HERO_SUBTITLE}</p>

                <button type="button" className="concierge-primary-btn" onClick={() => setStep('form')}>
                  {strings.HERO_CTA}
                  <ArrowForward fontSize="small" />
                </button>

                <div className="concierge-hero-features">
                  <span><LocationOn fontSize="inherit" /> {strings.FEATURE_LOCATIONS}</span>
                  <span><Business fontSize="inherit" /> {strings.FEATURE_COLLECTION}</span>
                  <span><AutoAwesome fontSize="inherit" /> {strings.FEATURE_ASSISTANT}</span>
                </div>
              </div>
            </section>
          )}

          {step === 'form' && (
            <section className="concierge-step concierge-intake">
              <button type="button" className="concierge-back-btn" onClick={() => setStep('hero')}>
                <ArrowBack fontSize="small" />
                {commonStrings.BACK}
              </button>

              <div className="concierge-intake-header">
                <h2>{strings.FORM_TITLE}</h2>
                <p>{strings.FORM_SUBTITLE}</p>
              </div>

              <form className="concierge-intake-form" onSubmit={handleCreateLead}>
                <div className="concierge-field">
                  <label>{commonStrings.FULL_NAME}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (errors.name) {
                        setErrors((previous) => ({ ...previous, name: undefined }))
                      }
                    }}
                    placeholder={strings.NAME_PLACEHOLDER}
                    autoComplete="off"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="concierge-field">
                  <label>{commonStrings.EMAIL}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      if (errors.email) {
                        setErrors((previous) => ({ ...previous, email: undefined }))
                      }
                    }}
                    placeholder={strings.EMAIL_PLACEHOLDER}
                    autoComplete="off"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="concierge-field">
                  <label>{commonStrings.PHONE}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value)
                      if (errors.phone) {
                        setErrors((previous) => ({ ...previous, phone: undefined }))
                      }
                    }}
                    placeholder={strings.PHONE_PLACEHOLDER}
                    autoComplete="off"
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="concierge-field">
                  <label>{strings.INTEREST_LABEL}</label>
                  <div className="concierge-choice-row">
                    <button
                      type="button"
                      className={`concierge-choice ${interest === 'buy' ? 'is-active' : ''}`}
                      onClick={() => setInterest('buy')}
                    >
                      {strings.INTEREST_BUY}
                    </button>
                    <button
                      type="button"
                      className={`concierge-choice ${interest === 'rent' ? 'is-active' : ''}`}
                      onClick={() => setInterest('rent')}
                    >
                      {strings.INTEREST_RENT}
                    </button>
                    <button
                      type="button"
                      className={`concierge-choice ${interest === 'sell' ? 'is-active' : ''}`}
                      onClick={() => setInterest('sell')}
                    >
                      {strings.INTEREST_SELL}
                    </button>
                  </div>
                </div>

                <button type="submit" className="concierge-primary-btn" disabled={isLeadSubmitting}>
                  {isLeadSubmitting ? commonStrings.PLEASE_WAIT : strings.FORM_CONTINUE}
                  <ArrowForward fontSize="small" />
                </button>
              </form>
            </section>
          )}

          {step === 'voice' && (
            <section className="concierge-step concierge-voice">
              <div className="concierge-voice-top">
                <button
                  type="button"
                  className="concierge-back-btn"
                  onClick={() => {
                    setStep('hero')
                  }}
                >
                  <ArrowBack fontSize="small" />
                  {strings.BACK_TO_HOME}
                </button>

                <button
                  type="button"
                  className="concierge-debug-btn"
                  onClick={() => setShowDebugLogs((value) => !value)}
                >
                  <Troubleshoot fontSize="small" />
                  {showDebugLogs ? strings.STANDARD_VIEW : strings.TROUBLESHOOT_VIEW}
                </button>
              </div>

              <div className="concierge-voice-header">
                <span className={`concierge-status ${statusClass}`}>
                  {voiceStatus === 'active' ? voiceActivity.toUpperCase() : statusLabel.toUpperCase()}
                </span>
                <h2>{strings.ASSISTANT_TITLE}</h2>
                {leadId && <p>{strings.LEAD_ID}: {leadId}</p>}
                {voiceError && <p className="concierge-error">{voiceError}</p>}
              </div>

              <div className="concierge-voice-body">
                <div className="concierge-visual-wrap">
                  <div className={`concierge-visualizer ${voiceStatus === 'active' ? 'is-live' : ''}`}>
                    {voiceStatus === 'active' && (
                      <div className="concierge-bars" aria-hidden>
                        {Array.from({ length: 8 }).map((_, index) => (
                          <span
                            key={`bar-${index}`}
                            style={{
                              height: `${Math.max(12, isSpeaking ? 24 + (index * 7) : 6 + (micLevel * 0.7) + (index % 3) * 4)}px`
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="concierge-visual-icon">
                      {voiceStatus === 'connecting'
                        ? <GraphicEq />
                        : <VolumeUp />}
                    </div>

                    {voiceStatus === 'active' && !isMuted && (
                      <div className="concierge-meter">
                        <span style={{ width: `${micLevel}%` }} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="concierge-log-panel">
                  <div className="concierge-log-head">
                    <span>{showDebugLogs ? strings.DIAGNOSTICS : strings.EVENT_LOG}</span>
                    <span>{voiceLanguage === 'en' ? strings.LANGUAGE_EN : strings.LANGUAGE_EG}</span>
                  </div>

                  <div className="concierge-log-content" ref={transcriptRef}>
                    {showDebugLogs ? (
                      <>
                        {debugLogs.length === 0 && <div className="concierge-log-empty">{strings.LOG_EMPTY}</div>}
                        {debugLogs.map((line, index) => (
                          <div key={`debug-${index}-${line.slice(0, 18)}`} className="concierge-debug-row">
                            {line}
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {transcripts.length === 0 && (
                          <div className="concierge-log-empty">{strings.TRANSCRIPT_EMPTY}</div>
                        )}
                        {transcripts.map((entry) => (
                          <div
                            key={`${entry.timestamp}-${entry.role}-${entry.text.slice(0, 12)}`}
                            className={`concierge-transcript-row ${entry.role === 'user' ? 'is-user' : 'is-model'}`}
                          >
                            {entry.text}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="concierge-voice-actions">
                <div className="concierge-language-switch">
                  <button
                    type="button"
                    className={voiceLanguage === 'en' ? 'is-active' : ''}
                    onClick={() => setVoiceLanguage('en')}
                    disabled={voiceStatus === 'active' || voiceStatus === 'connecting'}
                  >
                    {strings.LANGUAGE_EN}
                  </button>
                  <button
                    type="button"
                    className={voiceLanguage === 'eg' ? 'is-active' : ''}
                    onClick={() => setVoiceLanguage('eg')}
                    disabled={voiceStatus === 'active' || voiceStatus === 'connecting'}
                  >
                    {strings.LANGUAGE_EG}
                  </button>
                </div>

                <div className="concierge-control-row">
                  {(voiceStatus === 'idle' || voiceStatus === 'error') ? (
                    <button type="button" className="concierge-primary-btn" onClick={() => void connectVoice()}>
                      {strings.START_SESSION}
                      <ArrowForward fontSize="small" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`concierge-icon-btn ${isMuted ? 'is-muted' : ''}`}
                        onClick={() => setIsMuted((value) => !value)}
                      >
                        <MicOff fontSize="small" />
                      </button>
                      <button type="button" className="concierge-secondary-btn" onClick={endSession}>
                        {strings.END_SESSION}
                      </button>
                    </>
                  )}
                </div>

                <div className="concierge-meta-row">
                  <button type="button" className="concierge-ghost-btn" onClick={handleCopyLogs}>
                    {strings.COPY_LOGS}
                  </button>
                  <button type="button" className="concierge-ghost-btn" onClick={() => setDebugLogs([])}>
                    {strings.CLEAR_LOGS}
                  </button>
                </div>

                <div className="concierge-verified">
                  <CheckCircleOutline fontSize="small" />
                  <span>{strings.BETA_NOTE}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default Concierge
