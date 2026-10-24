import { useEffect, useRef, useState } from 'react'
import MarkdownRenderer from './components/MarkdownRenderer'
import './notices.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const makeId = () => `${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)
const Plus = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>
const Menu = () => <Icon><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
const Send = () => <Icon><path d="m3 3 18 9-18 9 3-9-3-9Zm3 9h8" /></Icon>
const Clip = () => <Icon><path d="m20.5 11.5-8.7 8.7a6 6 0 0 1-8.5-8.5L12 3a4 4 0 1 1 5.7 5.7L9.3 17.1a2 2 0 0 1-2.8-2.8l8-8" /></Icon>
const FolderIcon = () => (
  <Icon>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </Icon>
)
const FileDocIcon = () => (
  <Icon>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </Icon>
)
const Mic = () => <Icon><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></Icon>
const Close = () => <Icon><path d="m6 6 12 12M18 6 6 18" /></Icon>

const CopyIconSmall = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIconSmall = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const Sun = () => (
  <Icon>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </Icon>
)

const Moon = () => (
  <Icon>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Icon>
)

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function Avatar({ user }) {
  return <div className={`avatar ${user ? 'person' : ''}`}>{user ? 'U' : 'N'}</div>
}

function Message({ message }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const copyResponse = async () => {
    if (!message.content) return
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <article className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <Avatar user={isUser} />
      <div className="body">
        <div className="message-header-line">
          <b>{isUser ? 'You' : 'NOVA AI'}</b>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            {message.attachments.map((att, i) =>
              att.isImage && att.preview ? (
                <img key={i} src={att.preview} alt={att.name || 'Upload'} className="message-img" />
              ) : (
                <div key={i} className="message-file-chip" title={att.path || att.name}>
                  {att.path && att.path.includes('/') ? <FolderIcon /> : <FileDocIcon />}
                  <span className="file-name">{att.path || att.name}</span>
                  <span className="file-size">{formatSize(att.size)}</span>
                </div>
              )
            )}
          </div>
        )}
        {message.image && !message.attachments && (
          <img src={message.image} alt="Upload" className="message-img" />
        )}
        {isUser ? (
          <div className="user-bubble">{message.content}</div>
        ) : (
          <div className="assistant-content">
            {message.loading && !message.content ? (
              <span className="typing">
                <i />
                <i />
                <i />
              </span>
            ) : (
              <>
                <MarkdownRenderer content={message.content} isStreaming={Boolean(message.loading)} />
                {!message.loading && message.content && (
                  <div className="message-actions-bar">
                    <button
                      type="button"
                      className="msg-action-btn"
                      onClick={copyResponse}
                      title="Copy response"
                      aria-label="Copy response"
                    >
                      {copied ? <CheckIconSmall /> : <CopyIconSmall />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

const IGNORED_PATHS = ['node_modules/', '.git/', '__pycache__/', '.venv/', 'dist/', '.next/']

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('nova_theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [listening, setListening] = useState(false)
  const [notice, setNotice] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const sessionId = useRef(`nova_${makeId()}`)
  const fileRef = useRef(null)
  const folderRef = useRef(null)
  const inputRef = useRef(null)
  const endRef = useRef(null)
  const speechRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nova_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  useEffect(() => {
    const target = endRef.current
    if (target?.scrollIntoView) target.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.configured) {
          setNotice('GROQ_API_KEY is not set in backend/.env.')
        }
      })
      .catch(() => setNotice('Backend is offline. Start the NOVA AI API to chat.'))

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => setInput([...event.results].map((r) => r[0].transcript).join(''))
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    speechRef.current = recognition
  }, [])

  const updateAssistant = (id, update) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...update } : msg)))
  }

  const responseError = async (response) => {
    try {
      const body = await response.json()
      return body.detail || body.error || `Request failed (${response.status}).`
    } catch {
      return `Request failed (${response.status}).`
    }
  }

  const newChat = async () => {
    if (busy) return
    const oldSession = sessionId.current
    sessionId.current = `nova_${makeId()}`
    setMessages([])
    setInput('')
    clearAttachments()
    setOpen(false)
    setNotice('')
    try {
      await fetch(`${API_URL}/chat/clear?session_id=${encodeURIComponent(oldSession)}`, { method: 'DELETE' })
    } catch {
      /* local reset valid offline */
    }
    inputRef.current?.focus()
  }

  const addFilesToAttachments = (fileList) => {
    const newItems = []
    for (const file of fileList) {
      const relPath = file.webkitRelativePath || file.name
      if (IGNORED_PATHS.some((ignored) => relPath.includes(ignored))) {
        continue
      }
      if (file.size > 20 * 1024 * 1024) {
        setNotice(`Skipped ${file.name}: exceeds 20 MB limit.`)
        continue
      }
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)
      newItems.push({
        id: makeId(),
        file,
        name: file.name,
        path: relPath,
        size: file.size,
        isImage: isImg,
        preview: isImg ? URL.createObjectURL(file) : null,
      })
    }

    if (newItems.length > 0) {
      setAttachments((prev) => {
        const combined = [...prev, ...newItems]
        if (combined.length > 50) {
          setNotice('Added first 50 files. Folder contains more files than maximum upload batch.')
          return combined.slice(0, 50)
        }
        return combined
      })
      setNotice('')
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files) {
      addFilesToAttachments(Array.from(e.target.files))
    }
    e.target.value = ''
  }

  const handleFolderInput = (e) => {
    if (e.target.files) {
      addFilesToAttachments(Array.from(e.target.files))
    }
    e.target.value = ''
  }

  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id)
      if (found?.preview) URL.revokeObjectURL(found.preview)
      return prev.filter((a) => a.id !== id)
    })
  }

  const clearAttachments = () => {
    attachments.forEach((a) => {
      if (a.preview) URL.revokeObjectURL(a.preview)
    })
    setAttachments([])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const scanFileEntry = async (entry, path = '') => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file) => {
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path ? `${path}/${file.name}` : file.name,
          })
          resolve([file])
        })
      })
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader()
      return new Promise((resolve) => {
        dirReader.readEntries(async (entries) => {
          const results = await Promise.all(
            entries.map((child) => scanFileEntry(child, path ? `${path}/${entry.name}` : entry.name))
          )
          resolve(results.flat())
        })
      })
    }
    return []
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const items = e.dataTransfer.items
    if (items) {
      const filePromises = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null
        if (entry) {
          filePromises.push(scanFileEntry(entry))
        } else if (item.kind === 'file') {
          const f = item.getAsFile()
          if (f) filePromises.push(Promise.resolve([f]))
        }
      }
      const filesNested = await Promise.all(filePromises)
      addFilesToAttachments(filesNested.flat())
    } else if (e.dataTransfer.files) {
      addFilesToAttachments(Array.from(e.dataTransfer.files))
    }
  }

  const toggleVoice = () => {
    if (!speechRef.current) {
      setNotice('Voice input is not supported in this browser. Try Chrome, Edge, or Safari.')
      return
    }
    if (listening) {
      speechRef.current.stop()
    } else {
      speechRef.current.start()
      setListening(true)
    }
  }

  const send = async () => {
    const prompt = input.trim()
    if ((!prompt && attachments.length === 0) || busy) return

    const userAttachments = [...attachments]
    const defaultText =
      userAttachments.length > 0
        ? userAttachments.some((a) => a.isImage)
          ? 'Please analyze this image / file.'
          : 'Please analyze the uploaded files / folder.'
        : ''

    const user = {
      id: makeId(),
      role: 'user',
      content: prompt || defaultText,
      attachments: userAttachments,
    }

    const assistantId = makeId()
    const controller = new AbortController()
    abortRef.current = controller

    setMessages((prev) => [
      ...prev,
      user,
      { id: assistantId, role: 'assistant', content: '', loading: true },
    ])
    setInput('')
    setAttachments([])
    setBusy(true)
    setNotice('')

    try {
      let response
      if (userAttachments.length > 0) {
        const form = new FormData()
        form.append('message', prompt || defaultText)
        form.append('session_id', sessionId.current)
        userAttachments.forEach((att) => {
          form.append('files', att.file)
          form.append('paths', att.path || att.name)
        })
        response = await fetch(`${API_URL}/chat/upload`, {
          method: 'POST',
          body: form,
          signal: controller.signal,
        })
      } else {
        response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, session_id: sessionId.current }),
          signal: controller.signal,
        })
      }

      if (!response.ok || !response.body) {
        throw new Error(await responseError(response))
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      let buffer = ''
      let ended = false

      while (!ended) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''
        for (const event of events) {
          for (const line of event.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = JSON.parse(line.slice(6))
            if (data.error) throw new Error(data.error)
            if (typeof data.chunk === 'string') {
              answer += data.chunk
              updateAssistant(assistantId, { content: answer, loading: true })
            }
            if (data.done) ended = true
          }
        }
      }
      updateAssistant(assistantId, { content: answer || 'No response received. Please try again.', loading: false })
    } catch (error) {
      const msg = error.name === 'AbortError' ? 'Generation stopped.' : error.message || 'Could not contact NOVA AI.'
      updateAssistant(assistantId, { content: msg, loading: false })
      setNotice(msg)
    } finally {
      abortRef.current = null
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div
      className="app"
      data-theme={theme}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <aside className={open ? 'open' : ''}>
        <div className="sideTop">
          <button className="new" onClick={newChat}>
            <Plus />New chat
          </button>
          <button className="mobile" onClick={() => setOpen(false)} aria-label="Close menu">
            <Close />
          </button>
        </div>
        <p>Today</p>
        <button className="history">New conversation</button>

        <button
          className="theme-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <div className="account">
          <Avatar user />My workspace
        </div>
      </aside>

      {open && <button className="overlay" onClick={() => setOpen(false)} aria-label="Close menu" />}

      <main>
        <header>
          <div className="header-left">
            <button className="mobile" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu />
            </button>
            <span className="title">NOVA AI</span>
          </div>

          <div className="header-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <button className="mobile newMobile" onClick={newChat} aria-label="New chat">
              <Plus />
            </button>
          </div>
        </header>

        <section className="conversation">
          {messages.length ? (
            <div className="messages">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              <div ref={endRef} />
            </div>
          ) : (
            <div className="welcome">
              <div>N</div>
              <h1>How can NOVA AI help you today?</h1>
              <section className="suggestions">
                <button onClick={() => setInput('Explain a concept clearly with examples')}>
                  <b>Explain a concept</b>
                  <span>Break down a topic simply</span>
                </button>
                <button onClick={() => setInput('Help me write and improve some code')}>
                  <b>Write some code</b>
                  <span>Build or debug a feature</span>
                </button>
                <button onClick={() => setInput('Analyze this image and explain the details')}>
                  <b>Analyze image / folder</b>
                  <span>Upload screenshots, documents, or code</span>
                </button>
              </section>
            </div>
          )}
        </section>

        <footer>
          {notice && <div className="notice" role="status">{notice}</div>}
          <div className={`composer ${dragActive ? 'drag-overlay' : ''}`}>
            {attachments.length > 0 && (
              <div className="composer-attachments">
                {attachments.map((att) => (
                  <div key={att.id} className="attachment-chip" title={att.path || att.name}>
                    {att.isImage && att.preview ? (
                      <img src={att.preview} alt={att.name} className="chip-thumb" />
                    ) : (
                      <span className="chip-icon">
                        {att.path && att.path.includes('/') ? <FolderIcon /> : <FileDocIcon />}
                      </span>
                    )}
                    <span className="chip-text">{att.path || att.name}</span>
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => removeAttachment(att.id)}
                      aria-label="Remove attachment"
                    >
                      <Close />
                    </button>
                  </div>
                ))}
                {attachments.length > 1 && (
                  <button type="button" className="clear-all-btn" onClick={clearAttachments}>
                    Clear all ({attachments.length})
                  </button>
                )}
              </div>
            )}

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={attachments.length ? 'Ask about the attached files/images...' : 'Message NOVA AI, upload images, or drop folders...'}
              rows="1"
              disabled={busy}
            />

            <div className="actions">
              <input ref={fileRef} type="file" multiple hidden onChange={handleFileInput} />
              <input ref={folderRef} type="file" webkitdirectory="" directory="" multiple hidden onChange={handleFolderInput} />
              
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                title="Upload Files / Images"
                aria-label="Upload files or images"
              >
                <Clip />
              </button>
              <button
                type="button"
                onClick={() => folderRef.current?.click()}
                disabled={busy}
                title="Upload Folder"
                aria-label="Upload folder"
              >
                <FolderIcon />
              </button>
              <button
                type="button"
                className={listening ? 'recording' : ''}
                onClick={toggleVoice}
                disabled={busy}
                title="Voice input"
                aria-label="Voice input"
              >
                <Mic />
              </button>
              {busy ? (
                <button
                  type="button"
                  className="send"
                  onClick={() => abortRef.current?.abort()}
                  aria-label="Stop generating"
                >
                  <Close />
                </button>
              ) : (
                <button
                  type="button"
                  className="send"
                  onClick={send}
                  disabled={!input.trim() && attachments.length === 0}
                  aria-label="Send message"
                >
                  <Send />
                </button>
              )}
            </div>
          </div>
          <small>NOVA AI can analyze images, documents, and code folders.</small>
        </footer>
      </main>
    </div>
  )
}
