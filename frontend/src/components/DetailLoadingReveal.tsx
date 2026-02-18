import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { strings as commonStrings } from '@/lang/common'

import '@/assets/css/detail-loading-reveal.css'

export interface DetailLoadingRevealStat {
  label: string
  value: string
}

export interface DetailLoadingRevealPhase {
  heading: string
  body: string
  bubbles?: DetailLoadingRevealStat[]
  color?: string
}

export interface DetailLoadingRevealAction {
  id?: string
  label: string
  icon?: React.ReactNode
  tone?: 'view' | 'contact' | 'request'
  onClick: () => void
}

export type DetailLoadingRevealMotionMode = 'auto' | 'full' | 'reduced'

interface DetailLoadingRevealProps {
  visible: boolean
  title: string
  subtitle?: string
  description?: string
  images: string[]
  stats?: DetailLoadingRevealStat[]
  phases?: DetailLoadingRevealPhase[]
  finalActions?: DetailLoadingRevealAction[]
  accent?: string
  secondary?: string
  durationMs?: number
  motionMode?: DetailLoadingRevealMotionMode
  enableScrollScrub?: boolean
  allowClickPause?: boolean
  holdOnCompleteUntilClick?: boolean
  onComplete: () => void
}

const GOLD_TONE = '#d4bc8d'
const AZURE_TONE = '#9eb8cd'
const LAVENDER_TONE = '#b8a9c9'
const MIN_PHASES = 4
const EMPTY_STATS: DetailLoadingRevealStat[] = []
const EMPTY_PHASES: DetailLoadingRevealPhase[] = []
const EMPTY_ACTIONS: DetailLoadingRevealAction[] = []
const ACTION_TONES = ['view', 'contact', 'request'] as const

const trimText = (value?: string) => (value || '').trim()
const clampText = (value: string, max = 120) => (value.length > max ? `${value.slice(0, max - 3)}...` : value)

const DetailLoadingReveal = ({
  visible,
  title,
  subtitle,
  description,
  images,
  stats = EMPTY_STATS,
  phases = EMPTY_PHASES,
  finalActions = EMPTY_ACTIONS,
  accent = '#d97d74',
  secondary = '#a8b69f',
  durationMs = 7000,
  motionMode = 'auto',
  enableScrollScrub = false,
  allowClickPause = false,
  holdOnCompleteUntilClick = false,
  onComplete,
}: DetailLoadingRevealProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const onCompleteRef = useRef(onComplete)
  const forceCompleteRef = useRef<() => void>(() => undefined)
  const jumpToPhaseRef = useRef<(index: number) => void>(() => undefined)
  const togglePlaybackRef = useRef<() => void>(() => undefined)
  const awaitingDismissRef = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isAwaitingDismiss, setIsAwaitingDismiss] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(0)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const safeTitle = trimText(title) || 'Property'
  const safeSubtitle = trimText(subtitle) || 'Details'
  const safeDescription = trimText(description)

  const safeImages = useMemo(() => {
    const cleaned = images
      .map((img) => trimText(img))
      .filter((img) => Boolean(img))
    const unique = [...new Set(cleaned)]
    return unique.length > 0 ? unique : ['/cover.webp']
  }, [images])

  const resolvedStats = useMemo(() => {
    const cleaned = stats
      .map((stat) => ({
        label: trimText(stat.label),
        value: trimText(stat.value),
      }))
      .filter((stat) => stat.label && stat.value)
      .slice(0, 4)

    const fallback: DetailLoadingRevealStat[] = [
      { label: safeSubtitle, value: safeTitle },
      { label: 'Overview', value: safeDescription || safeTitle },
      { label: 'Summary', value: safeSubtitle },
      { label: 'Focus', value: safeTitle },
    ]

    return [...cleaned, ...fallback].slice(0, 4)
  }, [safeDescription, safeSubtitle, safeTitle, stats])

  const sanitizedPhaseOverrides = useMemo(() => (
    phases
      .map((phase) => ({
        heading: trimText(phase.heading),
        body: trimText(phase.body),
        bubbles: (phase.bubbles || [])
          .map((bubble) => ({
            label: trimText(bubble.label),
            value: trimText(bubble.value),
          }))
          .filter((bubble) => bubble.label && bubble.value)
          .slice(0, 3),
        color: trimText(phase.color),
      }))
      .filter((phase) => phase.heading && phase.body)
  ), [phases])

  const phaseColors = useMemo(
    () => [accent, secondary, GOLD_TONE, AZURE_TONE, LAVENDER_TONE],
    [accent, secondary],
  )

  const phaseCount = useMemo(() => (
    sanitizedPhaseOverrides.length > 0
      ? sanitizedPhaseOverrides.length
      : Math.max(MIN_PHASES, safeImages.length, resolvedStats.length, phaseColors.length)
  ), [phaseColors.length, resolvedStats.length, safeImages.length, sanitizedPhaseOverrides.length])

  const phaseImages = useMemo(() => (
    Array.from({ length: phaseCount }, (_item, index) => safeImages[index % safeImages.length])
  ), [phaseCount, safeImages])

  const detailSummary = useMemo(() => {
    if (!safeDescription) {
      return ''
    }
    return clampText(safeDescription.replace(/\s+/g, ' ').trim(), 160)
  }, [safeDescription])

  const locationStat = useMemo(() => {
    const match = resolvedStats.find((stat) => stat.label.toLowerCase().includes('location'))
    return match || resolvedStats[3] || resolvedStats[1]
  }, [resolvedStats])

  const phaseBlocks = useMemo(() => {
    if (sanitizedPhaseOverrides.length > 0) {
      return Array.from({ length: phaseCount }, (_item, index) => {
        const override = sanitizedPhaseOverrides[index]
        return {
          heading: override.heading,
          body: override.body,
          color: override.color || phaseColors[index % phaseColors.length],
        }
      })
    }

    return Array.from({ length: phaseCount }, (_item, index) => {
      const stat = resolvedStats[index % resolvedStats.length]
      if (index === 1) {
        return {
          heading: safeSubtitle,
          body: detailSummary || `${locationStat.label}: ${locationStat.value}`,
          color: phaseColors[index % phaseColors.length],
        }
      }
      return {
        heading: index === 0 ? safeTitle : stat.label,
        body: index === 0 ? (detailSummary || `${stat.label}: ${stat.value}`) : stat.value,
        color: phaseColors[index % phaseColors.length],
      }
    })
  }, [detailSummary, locationStat.label, locationStat.value, phaseColors, phaseCount, resolvedStats, safeSubtitle, safeTitle, sanitizedPhaseOverrides])

  const phaseBubbleItems = useMemo(() => {
    if (sanitizedPhaseOverrides.length > 0) {
      const fallback = Array.from({ length: 3 }, (_item, index) => resolvedStats[index % resolvedStats.length])
      return Array.from({ length: phaseCount }, (_item, phaseIndex) => {
        const override = sanitizedPhaseOverrides[phaseIndex]
        if (override?.bubbles && override.bubbles.length > 0) {
          return Array.from({ length: 3 }, (_bubble, bubbleIndex) => (
            override.bubbles?.[bubbleIndex] || fallback[bubbleIndex]
          ))
        }
        return fallback
      })
    }

    const basePhase = Array.from({ length: 3 }, (_item, index) => resolvedStats[index % resolvedStats.length])
    const detailsPhase: DetailLoadingRevealStat[] = [
      {
        label: safeSubtitle,
        value: detailSummary || resolvedStats[0].value,
      },
      {
        label: locationStat.label,
        value: locationStat.value,
      },
      resolvedStats[3] || resolvedStats[0],
    ]

    return Array.from({ length: phaseCount }, (_item, phaseIndex) => {
      if (phaseIndex === 0) {
        return basePhase
      }
      if (phaseIndex === 1) {
        return detailsPhase
      }
      return Array.from({ length: 3 }, (_bubble, bubbleIndex) => (
        resolvedStats[(phaseIndex + bubbleIndex) % resolvedStats.length]
      ))
    })
  }, [detailSummary, locationStat.label, locationStat.value, phaseCount, resolvedStats, safeSubtitle, sanitizedPhaseOverrides])

  const sanitizedFinalActions = useMemo(() => (
    finalActions
      .map((action) => ({
        id: trimText(action.id),
        label: trimText(action.label),
        icon: action.icon,
        tone: ACTION_TONES.includes(action.tone || 'view') ? action.tone : undefined,
        onClick: action.onClick,
      }))
      .filter((action) => action.label && typeof action.onClick === 'function')
      .slice(0, 3)
  ), [finalActions])

  const showFinalActionButtons = currentPhase >= (phaseCount - 1) && sanitizedFinalActions.length > 0

  useLayoutEffect(() => {
    if (!visible) {
      return undefined
    }

    const root = rootRef.current
    if (!root) {
      return undefined
    }

    const systemPrefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const useReducedMotion = motionMode === 'reduced'
      || (motionMode === 'auto' && systemPrefersReducedMotion)
    const minimumDuration = 3200 + ((phaseCount - 1) * 950)
    const revealDuration = Math.max(durationMs, minimumDuration)
    const minimumCompletionMs = motionMode === 'full' ? revealDuration : 0
    const revealStartedAt = performance.now()
    let completed = false
    let reducedMotionTimer = 0
    let completionTimer = 0
    let detachInteractions: (() => void) | undefined
    setIsPaused(false)
    setCurrentPhase(0)
    awaitingDismissRef.current = false
    setIsAwaitingDismiss(false)

    const forceComplete = () => {
      if (completed) {
        return
      }
      if (reducedMotionTimer) {
        window.clearTimeout(reducedMotionTimer)
        reducedMotionTimer = 0
      }
      if (completionTimer) {
        window.clearTimeout(completionTimer)
        completionTimer = 0
      }
      completed = true
      onCompleteRef.current()
    }
    forceCompleteRef.current = forceComplete
    jumpToPhaseRef.current = () => undefined
    togglePlaybackRef.current = () => undefined

    const completeOnce = () => {
      if (completed) {
        return
      }
      const elapsed = performance.now() - revealStartedAt
      const remaining = minimumCompletionMs - elapsed
      if (remaining > 0) {
        if (!completionTimer) {
          completionTimer = window.setTimeout(() => {
            completionTimer = 0
            completeOnce()
          }, Math.ceil(remaining))
        }
        return
      }
      forceComplete()
    }

    const armDismissOnClick = () => {
      if (completed || awaitingDismissRef.current || !holdOnCompleteUntilClick) {
        return
      }
      awaitingDismissRef.current = true
      setCurrentPhase(phaseCount - 1)
      setIsAwaitingDismiss(true)
      setIsPaused(true)
    }

    const ctx = gsap.context(() => {
      const textBlocks = Array.from(root.querySelectorAll<HTMLDivElement>('.detail-reveal-text-block'))
      const imageNodes = Array.from(root.querySelectorAll<HTMLImageElement>('.detail-reveal-image'))
      const bubbles = Array.from(root.querySelectorAll<HTMLDivElement>('.detail-reveal-bubble'))
      const bubbleLabels = Array.from(root.querySelectorAll<HTMLSpanElement>('.detail-reveal-bubble .label'))
      const bubbleValues = Array.from(root.querySelectorAll<HTMLSpanElement>('.detail-reveal-bubble .value'))
      const gears = Array.from(root.querySelectorAll<HTMLDivElement>('.detail-reveal-gear'))
      const visual = root.querySelector<HTMLDivElement>('.detail-reveal-visual')
      const orbA = root.querySelector<HTMLDivElement>('.detail-reveal-orb-a')
      const orbB = root.querySelector<HTMLDivElement>('.detail-reveal-orb-b')
      const orbC = root.querySelector<HTMLDivElement>('.detail-reveal-orb-c')
      const glowNode = root.querySelector<HTMLDivElement>('.detail-reveal-glow')

      if (
        textBlocks.length < phaseCount
        || imageNodes.length < phaseCount
        || bubbleLabels.length < 3
        || bubbleValues.length < 3
        || gears.length < 3
      ) {
        completeOnce()
        return
      }

      const updateBubbleValues = (phaseIndex: number) => {
        const isFinalActionPhase = phaseIndex >= (phaseCount - 1) && sanitizedFinalActions.length > 0
        if (isFinalActionPhase) {
          bubbleLabels.forEach((node) => {
            node.textContent = ''
          })
          bubbleValues.forEach((node, index) => {
            node.textContent = sanitizedFinalActions[index]?.label || ''
          })
          return
        }
        const items = phaseBubbleItems[phaseIndex] || phaseBubbleItems[0]
        bubbleLabels.forEach((node, index) => {
          node.textContent = items[index]?.label || resolvedStats[index]?.label || ''
        })
        bubbleValues.forEach((node, index) => {
          node.textContent = items[index]?.value || resolvedStats[index]?.value || ''
        })
      }

      gsap.set(root, {
        autoAlpha: 1,
        '--detail-reveal-accent': phaseColors[0],
        '--detail-reveal-secondary': phaseColors[1],
      })
      gsap.set(textBlocks, { autoAlpha: 0, y: 34 })
      gsap.set(imageNodes, { autoAlpha: 0, scale: 1.36 })
      gsap.set(bubbles, { autoAlpha: 0, scale: 0.82, y: 16 })
      gsap.set(gears, { borderColor: phaseColors[0] })
      gsap.set([textBlocks[0], imageNodes[0]], { autoAlpha: 1 })
      gsap.set(textBlocks[0], { y: 0 })
      gsap.set(imageNodes[0], { scale: 1 })
      gsap.set(visual, { scale: 1 })
      gsap.set(orbA, { opacity: 0.42 })
      gsap.set(orbB, { opacity: 0.12 })
      gsap.set(orbC, { opacity: 0.05 })
      gsap.set(glowNode, { backgroundColor: phaseColors[0], opacity: 0.2 })
      updateBubbleValues(0)
      setCurrentPhase(0)

      if (useReducedMotion) {
        gsap.set(bubbles, { autoAlpha: 1, scale: 1, y: 0 })
        reducedMotionTimer = window.setTimeout(() => {
          if (holdOnCompleteUntilClick) {
            armDismissOnClick()
            return
          }
          completeOnce()
        }, Math.max(1200, Math.min(2200, Math.floor(revealDuration * 0.45))))
        detachInteractions = undefined
        return
      }

      gsap.to(gears[0], { rotation: 360, duration: 40, repeat: -1, ease: 'none' })
      gsap.to(gears[1], { rotation: -360, duration: 60, repeat: -1, ease: 'none' })
      gsap.to(gears[2], { rotation: 180, duration: 30, repeat: -1, ease: 'none' })

      gsap.to(glowNode, {
        scale: 1.16,
        opacity: 0.32,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      bubbles.forEach((bubble, index) => {
        gsap.to(bubble, {
          y: -(8 + (index * 2)),
          duration: 2.1 + (index * 0.24),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })

      const getOrbOpacities = (phaseIndex: number): [number, number, number] => {
        const highlighted = phaseIndex % 3
        const values: [number, number, number] = [0.12, 0.12, 0.12]
        values[highlighted] = 0.52
        if (phaseIndex === phaseCount - 1) {
          values[(highlighted + 1) % 3] = 0.24
        }
        return values
      }

      const transitionToPhase = (
        timeline: gsap.core.Timeline,
        fromIndex: number,
        toIndex: number,
        at: number,
        orbOpacities: [number, number, number],
        visualScale: number,
      ) => {
        const color = phaseBlocks[toIndex].color

        timeline.to(textBlocks[fromIndex], {
          autoAlpha: 0,
          y: -36,
          duration: 0.48,
          ease: 'power2.out',
        }, at)
        timeline.to(imageNodes[fromIndex], {
          autoAlpha: 0,
          scale: 1.28,
          duration: 0.48,
          ease: 'power2.out',
        }, at)
        timeline.to(bubbles, {
          autoAlpha: 0,
          scale: 0.82,
          y: 12,
          duration: 0.28,
          ease: 'power1.out',
        }, at)
        timeline.call(() => {
          updateBubbleValues(toIndex)
          setCurrentPhase(toIndex)
        }, [], at + 0.12)
        timeline.to(textBlocks[toIndex], {
          autoAlpha: 1,
          y: 0,
          duration: 0.66,
          ease: 'power2.out',
        }, at + 0.1)
        timeline.to(imageNodes[toIndex], {
          autoAlpha: 1,
          scale: 1,
          duration: 0.78,
          ease: 'power2.out',
        }, at + 0.08)
        timeline.to(bubbles, {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 0.44,
          stagger: 0.08,
          ease: 'power2.out',
        }, at + 0.2)
        timeline.to(gears, {
          borderColor: color,
          duration: 0.8,
          ease: 'power2.inOut',
        }, at + 0.05)
        timeline.to(root, {
          '--detail-reveal-accent': color,
          '--detail-reveal-secondary': phaseColors[(toIndex + 1) % phaseColors.length],
          duration: 0.8,
          ease: 'power2.inOut',
        }, at + 0.05)
        timeline.to(orbA, { opacity: orbOpacities[0], duration: 0.75 }, at)
        timeline.to(orbB, { opacity: orbOpacities[1], duration: 0.75 }, at)
        timeline.to(orbC, { opacity: orbOpacities[2], duration: 0.75 }, at)
        timeline.to(glowNode, {
          backgroundColor: color,
          duration: 0.8,
          ease: 'power2.inOut',
        }, at + 0.06)
        timeline.to(visual, {
          scale: visualScale,
          duration: 0.9,
          ease: 'power2.inOut',
        }, at)
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => {
          if (holdOnCompleteUntilClick) {
            armDismissOnClick()
            return
          }
          completeOnce()
        },
      })

      tl.to(textBlocks[0], { autoAlpha: 1, y: 0, duration: 0.72 }, 0)
      tl.to(imageNodes[0], { autoAlpha: 1, scale: 1, duration: 0.85 }, 0)
      tl.to(bubbles, {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 0.48,
        stagger: 0.08,
        ease: 'power2.out',
      }, 0.2)
      tl.to(visual, { scale: 1.08, duration: 1.1 }, 0)

      const phaseGap = 1.55
      for (let phaseIndex = 1; phaseIndex < phaseCount; phaseIndex += 1) {
        transitionToPhase(
          tl,
          phaseIndex - 1,
          phaseIndex,
          1.2 + ((phaseIndex - 1) * phaseGap),
          getOrbOpacities(phaseIndex),
          1.08 + (phaseIndex * 0.08),
        )
      }

      tl.to({}, { duration: 0.45 })

      if (!holdOnCompleteUntilClick) {
        tl.to(visual, {
          scale: 1.72,
          autoAlpha: 0,
          duration: 1.32,
          ease: 'power3.inOut',
        }, '+=0.32')
        tl.to(root, {
          autoAlpha: 0,
          duration: 0.85,
          ease: 'expo.out',
        }, '<+0.16')
      } else {
        tl.to(visual, {
          scale: 1.14,
          duration: 0.64,
          ease: 'power2.out',
        }, '+=0.2')
      }

      const targetSeconds = revealDuration / 1000
      tl.pause(0)
      const autoDriver = gsap.to(tl, {
        progress: 1,
        duration: targetSeconds,
        ease: 'none',
      })

      const updatePauseState = (nextPaused: boolean) => {
        autoDriver.paused(nextPaused)
        tl.paused(nextPaused)
        setIsPaused(nextPaused)
      }

      togglePlaybackRef.current = () => {
        if (completed || awaitingDismissRef.current) {
          return
        }
        updatePauseState(!tl.paused())
      }

      const phaseSnapTimes = Array.from({ length: phaseCount }, (_item, index) => (
        index === 0
          ? 0.82
          : 1.2 + ((index - 1) * phaseGap) + 0.9
      ))
      const maxTime = Math.max(0, tl.duration() - 0.05)
      const clampedPhaseTimes = phaseSnapTimes.map((time) => Math.min(maxTime, time))

      jumpToPhaseRef.current = (index: number) => {
        if (completed) {
          return
        }
        const targetIndex = Math.max(0, Math.min(phaseCount - 1, index))
        updatePauseState(true)
        if (awaitingDismissRef.current) {
          awaitingDismissRef.current = false
          setIsAwaitingDismiss(false)
        }
        tl.time(clampedPhaseTimes[targetIndex], false)
        updateBubbleValues(targetIndex)
        setCurrentPhase(targetIndex)
      }

      const handleWheel = (event: WheelEvent) => {
        if (!enableScrollScrub) {
          return
        }
        event.preventDefault()
        if (!tl.paused()) {
          return
        }
        const delta = Math.max(-120, Math.min(120, event.deltaY))
        const progressStep = delta * 0.0014
        tl.progress(gsap.utils.clamp(0, 0.999, tl.progress() + progressStep))
      }

      const handleClick = () => {
        if (awaitingDismissRef.current) {
          completeOnce()
          return
        }
        if (!allowClickPause) {
          return
        }
        updatePauseState(!tl.paused())
      }

      if (enableScrollScrub) {
        root.addEventListener('wheel', handleWheel, { passive: false })
      }
      if (allowClickPause || holdOnCompleteUntilClick) {
        root.addEventListener('click', handleClick)
      }

      detachInteractions = () => {
        if (enableScrollScrub) {
          root.removeEventListener('wheel', handleWheel)
        }
        if (allowClickPause || holdOnCompleteUntilClick) {
          root.removeEventListener('click', handleClick)
        }
        autoDriver.kill()
      }
    }, root)

    return () => {
      completed = true
      if (reducedMotionTimer) {
        window.clearTimeout(reducedMotionTimer)
      }
      if (completionTimer) {
        window.clearTimeout(completionTimer)
      }
      jumpToPhaseRef.current = () => undefined
      forceCompleteRef.current = () => undefined
      togglePlaybackRef.current = () => undefined
      detachInteractions?.()
      ctx.revert()
    }
  }, [
    durationMs,
    motionMode,
    phaseBubbleItems,
    phaseBlocks,
    phaseColors,
    phaseCount,
    resolvedStats,
    sanitizedFinalActions,
    sanitizedPhaseOverrides,
    enableScrollScrub,
    allowClickPause,
    holdOnCompleteUntilClick,
    visible,
  ])

  const handlePrevPhase = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    jumpToPhaseRef.current(currentPhase - 1)
  }

  const handleNextPhase = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    jumpToPhaseRef.current(currentPhase + 1)
  }

  const handleExitPresentation = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    forceCompleteRef.current()
  }

  const handleTogglePlayback = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    togglePlaybackRef.current()
  }

  const handleFinalActionClick = (event: React.MouseEvent<HTMLButtonElement>, onClick: () => void) => {
    event.preventDefault()
    event.stopPropagation()
    onClick()
  }

  if (!visible) {
    return null
  }

  return (
    <div className={`detail-reveal-overlay ${isPaused ? 'is-paused' : ''}`} ref={rootRef} role="status" aria-live="polite">
      <div className="detail-reveal-ambient">
        <div className="detail-reveal-orb detail-reveal-orb-a" />
        <div className="detail-reveal-orb detail-reveal-orb-b" />
        <div className="detail-reveal-orb detail-reveal-orb-c" />
      </div>

      <div className="detail-reveal-content">
        <div className="detail-reveal-text-side">
          {phaseBlocks.map((phase, index) => (
            <div key={`phase-${index}`} className="detail-reveal-text-block">
              <h2 style={{ color: phase.color }}>{phase.heading}</h2>
              <p>{phase.body}</p>
            </div>
          ))}
        </div>

        <div className="detail-reveal-visual-side">
          <div className="detail-reveal-visual">
            <div className="detail-reveal-gear detail-reveal-gear-1" />
            <div className="detail-reveal-gear detail-reveal-gear-2" />
            <div className="detail-reveal-gear detail-reveal-gear-3" />

            <div className="detail-reveal-portal">
              {phaseImages.map((src, index) => (
                <img
                  key={`phase-image-${index}`}
                  src={src}
                  alt={safeTitle}
                  className="detail-reveal-image"
                />
              ))}
            </div>

            <div className="detail-reveal-glow" />

            <div className={`detail-reveal-bubbles${showFinalActionButtons ? ' is-actionable' : ''}`}>
              {Array.from({ length: 3 }, (_item, index) => {
                const action = showFinalActionButtons ? sanitizedFinalActions[index] : undefined
                const bubble = (phaseBubbleItems[currentPhase] || phaseBubbleItems[0] || [])[index]
                return (
                  <button
                    key={`bubble-${index}`}
                    type="button"
                    className={`detail-reveal-bubble detail-reveal-bubble-${index + 1}${action ? ` detail-reveal-action-pill detail-reveal-action-pill-${action.tone || 'view'}` : ''}`}
                    tabIndex={action ? 0 : -1}
                    onClick={(event) => {
                      if (!action) {
                        return
                      }
                      handleFinalActionClick(event, action.onClick)
                    }}
                  >
                    {action?.icon && (
                      <span className="detail-reveal-action-icon" aria-hidden>
                        {action.icon}
                      </span>
                    )}
                    <span className="label">{bubble?.label || ''}</span>
                    <span className="value">{action?.label || bubble?.value || ''}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="detail-reveal-controls">
        <button
          type="button"
          className="detail-reveal-control-btn"
          onClick={handlePrevPhase}
          disabled={currentPhase <= 0}
        >
          {commonStrings.BACK}
        </button>
        <button
          type="button"
          className="detail-reveal-control-btn"
          onClick={handleNextPhase}
          disabled={currentPhase >= (phaseCount - 1)}
        >
          {commonStrings.NEXT}
        </button>
        <button
          type="button"
          className="detail-reveal-control-btn"
          onClick={handleTogglePlayback}
          disabled={isAwaitingDismiss}
        >
          {isPaused ? 'Play' : 'Pause'}
        </button>
        <button
          type="button"
          className="detail-reveal-control-btn danger"
          onClick={handleExitPresentation}
        >
          {commonStrings.CLOSE}
        </button>
      </div>
      {(enableScrollScrub || allowClickPause || holdOnCompleteUntilClick || showFinalActionButtons) && (
        <div className="detail-reveal-interaction">
          {holdOnCompleteUntilClick && (
            <span>{isAwaitingDismiss ? 'Presentation complete. Click anywhere to continue.' : 'Presentation will wait for your click at the end.'}</span>
          )}
          {allowClickPause && !isAwaitingDismiss && (
            <span>{isPaused ? 'Presentation paused. Click to continue.' : 'Click to pause the presentation.'}</span>
          )}
          {enableScrollScrub && !isAwaitingDismiss && (
            <span>Pause first, then use mouse wheel to scrub backward or forward.</span>
          )}
        </div>
      )}
    </div>
  )
}

export default DetailLoadingReveal
