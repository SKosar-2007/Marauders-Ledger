import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => any
    SpeechRecognition?: new () => any
  }
}

export default function VoiceChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'I can hear you now. Ask me about anomalies, transactions, or the latest risk signals.' },
  ])
  const [draft, setDraft] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [status, setStatus] = useState('Tap the mic to speak with the assistant.')
  const [transcript, setTranscript] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef('')
  const messagesRef = useRef<ChatMessage[]>(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognitionCtor = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognitionCtor) {
      setStatus('Speech input is not available in this browser. You can still type a message instead.')
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
      transcriptRef.current = ''
      setTranscript('')
      setStatus('Listening... speak naturally.')
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0].transcript.trim()
        if (result.isFinal) {
          finalText += `${text} `
        } else {
          interim += `${text} `
        }
      }

      transcriptRef.current = `${transcriptRef.current} ${finalText}`.trim()
      setTranscript(`${transcriptRef.current} ${interim}`.trim())
    }

    recognition.onerror = () => {
      setIsListening(false)
      setStatus('Speech capture failed. Try typing a message instead.')
    }

    recognition.onend = () => {
      setIsListening(false)
      const finalText = transcriptRef.current.trim()
      if (finalText) {
        void sendMessage(finalText)
      } else {
        setStatus('No speech detected. Try again.')
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setIsThinking(true)
    setStatus('Generating a response...')
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])

    const history = messagesRef.current
      .slice(-8)
      .map((msg) => ({ role: msg.role, text: msg.text }))

    try {
      const token = localStorage.getItem('omniledger_token')
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to reach the voice assistant.')
      }

      const audioBlob = await response.blob()
      const replyText = response.headers.get('x-chat-response') || 'The assistant is ready.'

      if (audioBlob.size > 0) {
        const audioUrl = URL.createObjectURL(audioBlob)
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          await audioRef.current.play()
          audioRef.current.onended = () => URL.revokeObjectURL(audioUrl)
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: replyText }])
      setStatus('Response ready.')
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'The voice assistant is unavailable right now.' }])
      setStatus(error instanceof Error ? error.message : 'Voice chat failed.')
    } finally {
      setIsThinking(false)
      setDraft('')
      setTranscript('')
      transcriptRef.current = ''
    }
  }

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!draft.trim()) return
    await sendMessage(draft)
  }

  const canUseMic = useMemo(() => typeof window !== 'undefined' && (window.webkitSpeechRecognition || window.SpeechRecognition), [])

  return (
    <div className="border-[3px] border-primary bg-surface-container-lowest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col gap-4">
      <audio ref={audioRef} className="hidden" />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase text-on-surface-variant">ElevenLabs voice channel</p>
          <h3 className="font-display text-xl font-bold uppercase tracking-tight">Live Voice Assistant</h3>
        </div>
        <div className={`px-3 py-1 border-[2px] border-primary font-mono text-[10px] uppercase ${isListening ? 'bg-error text-on-error' : 'bg-secondary-container text-on-secondary-container'}`}>
          {isListening ? 'Listening' : isThinking ? 'Thinking' : 'Ready'}
        </div>
      </div>

      <div className="rounded-none border-[3px] border-primary bg-surface-container p-4 min-h-[220px] flex flex-col gap-3 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`max-w-[85%] px-3 py-2 border-[2px] border-primary font-body text-sm ${message.role === 'user' ? 'ml-auto bg-secondary-container text-on-secondary-container' : 'bg-surface text-on-surface'}`}>
            {message.text}
          </div>
        ))}
      </div>

      {transcript && (
        <div className="border-[2px] border-dashed border-primary bg-surface-container p-3 font-mono text-xs uppercase text-on-surface-variant">
          {transcript}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a question or ask aloud"
          className="w-full border-[3px] border-primary bg-surface-container-lowest px-4 py-3 font-mono text-xs uppercase outline-none"
        />
        <div className="flex gap-2">
          <button type="submit" className="flex-1 border-[3px] border-primary bg-primary px-4 py-3 font-mono text-xs uppercase text-on-primary hover:bg-tertiary-fixed hover:text-on-tertiary-fixed transition-colors">
            Send Message
          </button>
          {canUseMic ? (
            <button
              type="button"
              onClick={() => {
                if (recognitionRef.current) {
                  if (isListening) {
                    recognitionRef.current.stop()
                  } else {
                    recognitionRef.current.start()
                  }
                }
              }}
              className={`border-[3px] border-primary px-4 py-3 font-mono text-xs uppercase transition-colors ${isListening ? 'bg-error text-on-error' : 'bg-surface-container text-on-surface hover:bg-secondary-container hover:text-on-secondary-container'}`}
            >
              {isListening ? 'Stop Mic' : 'Start Mic'}
            </button>
          ) : null}
        </div>
      </form>

      <p className="font-mono text-[10px] uppercase text-on-surface-variant">{status}</p>
    </div>
  )
}
