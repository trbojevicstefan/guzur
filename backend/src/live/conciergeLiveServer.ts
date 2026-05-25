import type http from 'node:http'
import type https from 'node:https'
import { GoogleGenAI, Modality } from '@google/genai'
import { WebSocket, WebSocketServer } from 'ws'
import * as env from '../config/env.config'
import * as logger from '../utils/logger'

type NodeServer = http.Server | https.Server

interface LiveClientMessage {
  audio?: string
  text?: string
}

const wsConstructor = WebSocket as unknown as typeof globalThis.WebSocket

if ((globalThis as any).WebSocket !== wsConstructor) {
  ;(globalThis as any).WebSocket = wsConstructor
}

const liveAI = env.GEMINI_API_KEY
  ? new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'guzur-concierge-live',
      },
    },
  })
  : null

const resolveInstruction = (lang: string, userName: string) => {
  const normalizedName = userName.trim() || 'Guest'
  const isEgyptian = lang === 'eg' || lang === 'ar'

  if (isEgyptian) {
    return `أنتِ "ليلى" مساعدة عقارية لمشروع "جذور". اسم العميل ${normalizedName}. تحدثي باللهجة المصرية بأسلوب احترافي وودود، وبإجابات مختصرة، وركزي على البيع والإيجار والخطوات التالية.`
  }

  return `You are "Layla", a real-estate concierge for "Guzur". The customer name is ${normalizedName}. Keep replies short, warm, and professional. Focus on sale and rent options with practical next steps.`
}

export const attachConciergeLiveServer = (server: NodeServer) => {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', 'http://localhost')
      if (url.pathname !== '/live') {
        socket.destroy()
        return
      }

      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit('connection', clientWs, request)
      })
    } catch (err) {
      logger.error('[concierge-live] WebSocket upgrade failed', err)
      socket.destroy()
    }
  })

  wss.on('connection', async (clientWs, request) => {
    const url = new URL(request.url || '', 'http://localhost')
    const lang = String(url.searchParams.get('lang') || 'en').toLowerCase()
    const userName = String(url.searchParams.get('name') || 'Guest')

    logger.info('[concierge-live] Client connected', { lang, userName })

    if (!liveAI) {
      const message = 'Gemini Live API key is missing on server.'
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: message }))
      }
      clientWs.close()
      return
    }

    let session: any = null

    try {
      session = await liveAI.live.connect({
        model: env.GEMINI_LIVE_MODEL,
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready' }))
            }
          },
          onmessage: (message: unknown) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify(message))
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.close()
            }
          },
          onerror: (error: unknown) => {
            const errorMessage = error && typeof error === 'object' && 'message' in error
              ? String((error as { message?: string }).message || 'Gemini Live connection error.')
              : 'Gemini Live connection error.'

            logger.error('[concierge-live] Gemini callback error', error)
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ error: errorMessage }))
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: env.GEMINI_LIVE_VOICE,
              },
            },
          },
          systemInstruction: resolveInstruction(lang, userName),
        },
      })
    } catch (err) {
      logger.error('[concierge-live] Failed to initialize Gemini Live session', err)
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ error: 'Failed to connect to Gemini Live.' }))
      }
      clientWs.close()
      return
    }

    clientWs.on('message', async (rawPayload) => {
      try {
        const payload = JSON.parse(String(rawPayload)) as LiveClientMessage

        if (payload.audio) {
          await session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          })
          return
        }

        if (payload.text) {
          await session.sendRealtimeInput({
            text: payload.text,
          })
        }
      } catch (err) {
        logger.error('[concierge-live] Failed to process inbound client payload', err)
      }
    })

    clientWs.on('close', () => {
      try {
        session?.close()
      } catch (err) {
        logger.error('[concierge-live] Failed to close Gemini Live session', err)
      }
      logger.info('[concierge-live] Client disconnected')
    })

    clientWs.on('error', (err) => {
      logger.error('[concierge-live] Client WebSocket error', err)
    })
  })
}
