import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
  Settings as SettingsIcon,
  PlayArrow,
  Stop,
} from '@mui/icons-material'
import validator from 'validator'
import { gsap } from 'gsap'
import Vapi from '@vapi-ai/web'
import * as movininTypes from ':movinin-types'
import Layout from '@/components/Layout'
import Footer from '@/components/Footer'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/concierge'
import * as LeadService from '@/services/LeadService'
import * as helper from '@/utils/helper'

import '@/assets/css/concierge.css'

type MicPermission = 'granted' | 'denied' | 'prompt' | 'unknown'
type CallStatus = 'ready' | 'connecting' | 'active' | 'ending' | 'error'

interface FieldErrors {
  name?: string
  email?: string
  phone?: string
}

interface AssistantOption {
  id: string
  name: string
  flag: string
}

const ASSISTANT_STORAGE_KEY = 'mi-fe-concierge-assistant-id'
const PHONE_PATTERN = /^[0-9()+\-\s]{7,20}$/
const HARD_CODED_ASSISTANTS: AssistantOption[] = [
  {
    id: '66648ea5-e112-4bfc-b894-4e9edd5605c6',
    name: 'English',
    flag: '🇬🇧',
  },
  {
    id: '4aae5924-3d5d-4237-a7f6-757d17cb1ba4',
    name: 'Egyptian',
    flag: '🇪🇬',
  },
]

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'string') {
    return err
  }

  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message?: string }).message || fallback)
  }

  return fallback
}

const formatLogPayload = (payload: unknown) => {
  if (typeof payload === 'undefined') {
    return ''
  }

  if (typeof payload === 'string') {
    return payload
  }

  try {
    const text = JSON.stringify(payload)
    return text.length > 420 ? `${text.slice(0, 420)}...` : text
  } catch {
    return String(payload)
  }
}

const Concierge = () => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)
  const vapiRef = useRef<Vapi | null>(null)
  const listenersBoundRef = useRef(false)

  const initialAssistantId = useMemo(() => {
    const savedAssistantId = localStorage.getItem(ASSISTANT_STORAGE_KEY) || env.VAPI_DEFAULT_ASSISTANT_ID || ''
    const matched = HARD_CODED_ASSISTANTS.find((assistant) => assistant.id === savedAssistantId)
    return matched?.id || HARD_CODED_ASSISTANTS[0]?.id || ''
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [assistantId, setAssistantId] = useState(initialAssistantId)
  const [assistantInput, setAssistantInput] = useState(initialAssistantId)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown')
  const [callStatus, setCallStatus] = useState<CallStatus>('ready')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leadId, setLeadId] = useState('')
  const [callId, setCallId] = useState('')
  const [lastError, setLastError] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const selectedAssistant = useMemo(
    () => HARD_CODED_ASSISTANTS.find((assistant) => assistant.id === assistantId),
    [assistantId]
  )

  const appendLog = useCallback((tag: string, message: string, payload?: unknown) => {
    const next = `[${new Date().toISOString()}] [${tag}] ${message}${payload ? ` ${formatLogPayload(payload)}` : ''}`
    setLogs((previous) => [...previous.slice(-99), next])
  }, [])

  const micPermissionLabel = useMemo(() => {
    switch (micPermission) {
      case 'granted':
        return strings.MIC_GRANT
      case 'denied':
        return strings.MIC_DENY
      case 'prompt':
        return strings.MIC_PROMPT
      default:
        return strings.MIC_UNKNOWN
    }
  }, [micPermission])

  const callStatusLabel = useMemo(() => {
    switch (callStatus) {
      case 'connecting':
        return strings.CALL_CONNECTING
      case 'active':
        return strings.CALL_ACTIVE
      case 'ending':
        return strings.CALL_ENDING
      case 'error':
        return strings.CALL_ERROR
      default:
        return strings.CALL_READY
    }
  }, [callStatus])

  const callStatusClass = useMemo(() => {
    switch (callStatus) {
      case 'connecting':
        return 'is-connecting'
      case 'active':
        return 'is-active'
      case 'error':
        return 'is-error'
      default:
        return ''
    }
  }, [callStatus])

  const ensureVapiClient = useCallback(() => {
    if (!env.VAPI_PUBLIC_KEY) {
      throw new Error(strings.MISSING_VAPI_KEY)
    }

    if (!vapiRef.current) {
      vapiRef.current = new Vapi(env.VAPI_PUBLIC_KEY)
      appendLog('init', 'Vapi SDK initialized')
    }

    if (!listenersBoundRef.current) {
      listenersBoundRef.current = true

      vapiRef.current.on('call-start', () => {
        setCallStatus('active')
        appendLog('call', 'Call started')
      })

      vapiRef.current.on('call-end', () => {
        setCallStatus('ready')
        setVolumeLevel(0)
        appendLog('call', 'Call ended')
      })

      vapiRef.current.on('speech-start', () => {
        appendLog('speech', 'Assistant started speaking')
      })

      vapiRef.current.on('speech-end', () => {
        appendLog('speech', 'Assistant stopped speaking')
      })

      vapiRef.current.on('volume-level', (volume: number) => {
        setVolumeLevel(Math.max(0, Math.min(1, volume)))
      })

      vapiRef.current.on('message', (message: any) => {
        if (message?.call?.id) {
          setCallId(String(message.call.id))
        }
        appendLog('event', 'Message', message)
      })

      vapiRef.current.on('call-start-progress', (event: any) => {
        appendLog('progress', `${event?.stage || 'stage'} ${event?.status || ''}`.trim(), event)
      })

      vapiRef.current.on('call-start-success', (event: any) => {
        if (event?.callId) {
          setCallId(String(event.callId))
        }
        appendLog('call', 'Call start success', event)
      })

      vapiRef.current.on('call-start-failed', (event: any) => {
        const message = event?.error || strings.CALL_START_FAILED
        setCallStatus('error')
        setLastError(String(message))
        appendLog('error', 'Call start failed', event)
      })

      vapiRef.current.on('error', (error: any) => {
        const message = getErrorMessage(error, strings.CALL_START_FAILED)
        setCallStatus('error')
        setLastError(message)
        appendLog('error', 'SDK error', error)
      })
    }

    return vapiRef.current
  }, [appendLog])

  const syncMicrophonePermission = useCallback(async () => {
    if (!navigator?.permissions || !navigator.permissions.query) {
      setMicPermission('unknown')
      return
    }

    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setMicPermission((status.state as MicPermission) || 'unknown')
    } catch {
      setMicPermission('unknown')
    }
  }, [])

  const requestMicrophoneAccess = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('mediaDevices.getUserMedia not supported')
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    setMicPermission('granted')
    appendLog('mic', 'Microphone access granted')
  }, [appendLog])

  const validateForm = () => {
    const nextErrors: FieldErrors = {}
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      nextErrors.name = strings.FIELD_REQUIRED
    }
    if (!trimmedEmail) {
      nextErrors.email = strings.FIELD_REQUIRED
    } else if (!validator.isEmail(trimmedEmail)) {
      nextErrors.email = strings.INVALID_EMAIL
    }
    if (!trimmedPhone) {
      nextErrors.phone = strings.FIELD_REQUIRED
    } else if (!PHONE_PATTERN.test(trimmedPhone)) {
      nextErrors.phone = strings.INVALID_PHONE
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSaveAssistant = () => {
    const nextAssistant = assistantInput.trim()
    if (!nextAssistant) {
      helper.error(null, strings.MISSING_ASSISTANT)
      return
    }

    const selected = HARD_CODED_ASSISTANTS.find((assistant) => assistant.id === nextAssistant)
    if (!selected) {
      helper.error(null, strings.MISSING_ASSISTANT)
      return
    }

    localStorage.setItem(ASSISTANT_STORAGE_KEY, nextAssistant)
    setAssistantId(nextAssistant)
    setAssistantInput(nextAssistant)
    setSettingsOpen(false)
    appendLog('config', `Assistant saved: ${nextAssistant}`)
    helper.info(strings.ASSISTANT_SAVED)
  }

  const stopCall = useCallback(async () => {
    if (!vapiRef.current) {
      setCallStatus('ready')
      return
    }

    try {
      setCallStatus('ending')
      appendLog('call', 'Stopping call')
      await vapiRef.current.stop()
      setCallStatus('ready')
    } catch (err) {
      const message = getErrorMessage(err, strings.CALL_START_FAILED)
      setCallStatus('error')
      setLastError(message)
      appendLog('error', 'Stop call failed', err)
    }
  }, [appendLog])

  const handleCallButton = async () => {
    if (callStatus === 'active' || callStatus === 'connecting') {
      await stopCall()
      return
    }

    if (!validateForm()) {
      helper.error(null, commonStrings.FIX_ERRORS)
      return
    }

    if (!env.VAPI_PUBLIC_KEY) {
      helper.error(null, strings.MISSING_VAPI_KEY)
      setLastError(strings.MISSING_VAPI_KEY)
      return
    }

    const selectedAssistantId = assistantId.trim()
    if (!selectedAssistantId) {
      helper.error(null, strings.MISSING_ASSISTANT)
      setLastError(strings.MISSING_ASSISTANT)
      setSettingsOpen(true)
      return
    }

    setIsSubmitting(true)
    setLastError('')
    setCallStatus('connecting')

    try {
      await requestMicrophoneAccess()

      const leadPayload: movininTypes.CreateLeadPayload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        source: 'concierge-beta',
        message: `Concierge beta call requested. Assistant: ${selectedAssistantId}`,
      }

      let lead: movininTypes.Lead
      try {
        lead = await LeadService.createLead(leadPayload)
      } catch (leadErr) {
        appendLog('error', 'Lead creation failed', leadErr)
        throw new Error(strings.LEAD_CREATE_FAILED)
      }

      const nextLeadId = String((lead as movininTypes.Lead)?._id || '')
      if (!nextLeadId) {
        appendLog('lead', 'Lead created without id', lead)
      } else {
        setLeadId(nextLeadId)
        appendLog('lead', `Lead created: ${nextLeadId}`)
      }

      const vapi = ensureVapiClient()
      const call = await vapi.start(selectedAssistantId)
      const nextCallId = String((call as { id?: string } | null)?.id || '')
      if (nextCallId) {
        setCallId(nextCallId)
      }

      appendLog('call', 'Call start requested', {
        assistantId: selectedAssistantId,
        callId: nextCallId || undefined,
      })
    } catch (err) {
      const message = getErrorMessage(err, strings.CALL_START_FAILED)
      setCallStatus('error')
      setLastError(message)
      appendLog('error', 'Start flow failed', err)
      if (message === strings.LEAD_CREATE_FAILED) {
        helper.error(err, strings.LEAD_CREATE_FAILED)
      } else {
        helper.error(err, message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLogs = async () => {
    try {
      const text = logs.join('\n')
      await navigator.clipboard.writeText(text)
      helper.info(strings.LOG_COPIED)
    } catch (err) {
      helper.error(err)
    }
  }

  useEffect(() => {
    syncMicrophonePermission()
  }, [syncMicrophonePermission])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const nodes = gsap.utils.toArray<HTMLElement>('.concierge-reveal')
      gsap.set(nodes, { autoAlpha: 0, y: 22 })
      gsap.to(nodes, {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        ease: 'power3.out',
        stagger: 0.08,
      })

      gsap.to('.concierge-badge', {
        y: -6,
        repeat: -1,
        yoyo: true,
        duration: 2.4,
        ease: 'sine.inOut',
      })
    }, rootRef)

    return () => {
      ctx.revert()
    }
  }, [])

  useEffect(() => {
    const node = logRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [logs])

  useEffect(
    () => () => {
      if (vapiRef.current) {
        vapiRef.current.removeAllListeners()
        vapiRef.current.stop().catch(() => null)
      }
    },
    []
  )

  return (
    <Layout strict={false}>
      <div className="concierge-page" ref={rootRef}>
        <div className="concierge-shell">
          <div className="concierge-grid">
            <section className="concierge-hero concierge-reveal">
              <div className="concierge-hero-inner">
                <img src="/guzurlogo.png" alt={env.WEBSITE_NAME} className="concierge-logo" />
                <span className="concierge-badge">{strings.PAGE_BADGE}</span>
                <h1>{strings.PAGE_TITLE}</h1>
                <p>{strings.PAGE_SUBTITLE}</p>
                <div className="concierge-note">{strings.BETA_NOTE}</div>
              </div>
            </section>

            <section className="concierge-panel concierge-reveal">
              <div className="concierge-panel-inner">
                <div className="concierge-panel-top">
                  <div className="concierge-panel-title">
                    <h2>{strings.FORM_TITLE}</h2>
                    <p>{strings.FORM_SUBTITLE}</p>
                  </div>
                  <button
                    type="button"
                    className="concierge-settings-toggle"
                    aria-label={strings.SETTINGS_TITLE}
                    onClick={() => setSettingsOpen((open) => !open)}
                  >
                    <SettingsIcon fontSize="small" />
                  </button>
                </div>

                {settingsOpen && (
                  <div className="concierge-settings concierge-reveal">
                    <label>{strings.SETTINGS_TITLE}</label>
                    <div className="concierge-settings-select-wrap">
                      <select
                        value={assistantInput}
                        onChange={(event) => setAssistantInput(event.target.value)}
                      >
                        {HARD_CODED_ASSISTANTS.map((assistant) => (
                          <option key={assistant.id} value={assistant.id}>
                            {assistant.flag} {assistant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="concierge-settings-actions">
                      <button type="button" onClick={handleSaveAssistant}>{strings.SAVE_ASSISTANT}</button>
                    </div>
                  </div>
                )}

                <div className="concierge-form">
                  <div className="concierge-field concierge-reveal">
                    <label>{commonStrings.FULL_NAME}</label>
                    <div className="concierge-input-wrap">
                      <PersonOutline fontSize="small" />
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
                    </div>
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  <div className="concierge-field concierge-reveal">
                    <label>{commonStrings.EMAIL}</label>
                    <div className="concierge-input-wrap">
                      <EmailOutlined fontSize="small" />
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
                    </div>
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className="concierge-field concierge-reveal">
                    <label>{commonStrings.PHONE}</label>
                    <div className="concierge-input-wrap">
                      <PhoneOutlined fontSize="small" />
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
                    </div>
                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                  </div>

                  <div className="concierge-cta-row concierge-reveal">
                    <button
                      type="button"
                      className="concierge-call-btn"
                      onClick={handleCallButton}
                      disabled={isSubmitting || callStatus === 'ending'}
                    >
                      {(callStatus === 'active' || callStatus === 'connecting') ? (
                        <>
                          {strings.STOP_CALL}
                          <Stop fontSize="small" />
                        </>
                      ) : (
                        <>
                          {strings.START_CALL}
                          <PlayArrow fontSize="small" />
                        </>
                      )}
                    </button>

                    <div className={`concierge-status ${callStatusClass}`}>
                      {callStatusLabel}
                    </div>
                  </div>
                </div>

                <div className="concierge-diagnostics concierge-reveal">
                  <h3>{strings.DIAGNOSTICS}</h3>
                  <div className="concierge-stat-grid">
                    <div className="concierge-stat">
                      <span className="label">{strings.MIC_STATUS}</span>
                      <span className="value">{micPermissionLabel}</span>
                      <div className="concierge-meter">
                        <span style={{ width: `${Math.round(volumeLevel * 100)}%` }} />
                      </div>
                    </div>
                    <div className="concierge-stat">
                      <span className="label">{strings.ASSISTANT_ID}</span>
                      <span className="value">
                        {selectedAssistant ? `${selectedAssistant.flag} ${selectedAssistant.name} (${selectedAssistant.id})` : '-'}
                      </span>
                    </div>
                    <div className="concierge-stat">
                      <span className="label">{strings.LEAD_ID}</span>
                      <span className="value">{leadId || '-'}</span>
                    </div>
                    <div className="concierge-stat">
                      <span className="label">{strings.CALL_ID}</span>
                      <span className="value">{callId || '-'}</span>
                    </div>
                    <div className="concierge-stat">
                      <span className="label">{strings.LAST_ERROR}</span>
                      <span className="value">{lastError || '-'}</span>
                    </div>
                  </div>

                  <div className="concierge-log-actions">
                    <button type="button" onClick={handleCopyLogs}>{strings.COPY_LOGS}</button>
                    <button type="button" onClick={() => setLogs([])}>{strings.CLEAR_LOGS}</button>
                  </div>

                  <div className="concierge-log" ref={logRef}>
                    <div className="concierge-log-row">{strings.EVENT_LOG}</div>
                    {logs.length === 0 ? (
                      <div className="concierge-log-row">-</div>
                    ) : (
                      logs.map((line, index) => (
                        <div className="concierge-log-row" key={`${index}-${line.slice(0, 24)}`}>
                          {line}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default Concierge
