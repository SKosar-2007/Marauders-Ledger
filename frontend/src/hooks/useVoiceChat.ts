import { useState, useRef, useCallback, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface UseVoiceChatReturn {
  messages: Message[]
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  interimTranscript: string
  startListening: () => void
  stopListening: () => void
  sendText: (text: string) => void
  toggleListening: () => void
  isSupported: boolean
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

  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  const playQueue = useCallback(async () => {
    const audioContext = audioContextRef.current || new AudioContext()
    audioContextRef.current = audioContext

    while (audioQueueRef.current.length > 0 && !abortRef.current) {
      const chunk = audioQueueRef.current.shift()!
      try {
        const audioBuffer = await audioContext.decodeAudioData(chunk)
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer
        source.connect(audioContext.destination)
        await new Promise<void>((resolve) => {
          source.onended = () => resolve()
          source.start()
        })
      } catch {
        // Skip decode errors from partial chunks
      }
    }

    isPlayingRef.current = false
    setIsSpeaking(false)
  }, [])

  const sendText = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setIsProcessing(true)

    try {
      const token = localStorage.getItem('marauders_token')
      const resp = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
        }),
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
        if (!isPlayingRef.current) {
          isPlayingRef.current = true
          playQueue()
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setIsProcessing(false)
    }
  }, [messages, playQueue])

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
  }
}
