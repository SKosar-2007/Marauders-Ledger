import { useState, useRef, useCallback, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface VoiceChatContext {
  anomaly_id?: number | null
  batch_id?: string | null
}

interface UseVoiceChatReturn {
  messages: Message[]
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  sendText: (text: string, context?: VoiceChatContext) => void
  toggleListening: () => void
  isSupported: boolean
  updateContext: (ctx: VoiceChatContext) => void
}

export function useVoiceChat(): UseVoiceChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')

  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const abortRef = useRef<boolean>(false)
  const contextRef = useRef<VoiceChatContext>({})

  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  const playAudio = useCallback(async () => {
    const audioContext = audioContextRef.current || new AudioContext()
    audioContextRef.current = audioContext

    const chunks = audioQueueRef.current
    audioQueueRef.current = []
    if (chunks.length === 0) {
      isPlayingRef.current = false
      setIsSpeaking(false)
      return
    }

    try {
      const totalLen = chunks.reduce((acc, c) => acc + c.byteLength, 0)
      const merged = new Uint8Array(totalLen)
      let offset = 0
      for (const c of chunks) {
        merged.set(new Uint8Array(c), offset)
        offset += c.byteLength
      }
      const audioBuffer = await audioContext.decodeAudioData(merged.buffer)
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      await new Promise<void>((resolve) => {
        source.onended = () => resolve()
        source.start()
      })
    } catch (e) {
      console.error('Audio decode/play error:', e)
    }

    isPlayingRef.current = false
    setIsSpeaking(false)
  }, [])

  const sendText = useCallback(async (text: string, context?: VoiceChatContext) => {
    if (!text.trim()) return

    const userMsg: Message = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setIsProcessing(true)

    try {
      const token = localStorage.getItem('marauders_token')
      const ctx = context || contextRef.current
      const body: Record<string, any> = {
        message: text.trim(),
        history: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
      }
      if (ctx?.anomaly_id) body.anomaly_id = ctx.anomaly_id
      if (ctx?.batch_id) body.batch_id = ctx.batch_id
      const resp = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!resp.ok) throw new Error(`Chat failed: ${resp.status}`)

      const responseText = resp.headers.get('X-Chat-Response') || ''
      if (responseText) {
        setMessages(prev => [...prev, { role: 'assistant', text: responseText }])
      }

      setIsProcessing(false)

      // Play audio from response body
      setIsSpeaking(true)
      audioQueueRef.current = []
      isPlayingRef.current = false
      abortRef.current = false

      const reader = resp.body!.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (abortRef.current) {
          reader.cancel()
          break
        }
        audioQueueRef.current.push(value.buffer)
      }

      if (audioQueueRef.current.length > 0) {
        isPlayingRef.current = true
        playAudio()
      } else {
        setIsSpeaking(false)
      }
    } catch (err) {
      console.error('Chat error:', err)
      setIsProcessing(false)
    }
  }, [messages, playAudio])

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      setInterimTranscript(interim)
      if (final) {
        setInterimTranscript('')
        sendText(final)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isSupported, sendText])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  useEffect(() => {
    return () => {
      abortRef.current = true
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const updateContext = useCallback((ctx: VoiceChatContext) => {
    contextRef.current = ctx
  }, [])

  return {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    interimTranscript,
    startListening,
    stopListening,
    sendText,
    toggleListening,
    isSupported,
    updateContext,
  }
}
