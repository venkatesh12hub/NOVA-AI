import { useMemo, useState } from 'react'
import hljs from 'highlight.js'

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="code-btn-icon"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="code-btn-icon"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Language alias map for cleaner header display
const LANG_DISPLAY_MAP = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  sh: 'Bash',
  bash: 'Bash',
  shell: 'Shell',
  ps1: 'PowerShell',
  powershell: 'PowerShell',
  json: 'JSON',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  cs: 'C#',
  csharp: 'C#',
  rust: 'Rust',
  rs: 'Rust',
  go: 'Go',
  golang: 'Go',
  yml: 'YAML',
  yaml: 'YAML',
  md: 'Markdown',
  markdown: 'Markdown',
  xml: 'XML',
  dockerfile: 'Dockerfile',
}

export default function CodeBlock({ language, code = '' }) {
  const [copied, setCopied] = useState(false)

  const cleanLang = (language || '').toLowerCase().trim()
  const displayLang = LANG_DISPLAY_MAP[cleanLang] || cleanLang || 'code'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older clipboard API environments
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }

  const highlightedHtml = useMemo(() => {
    if (!code) return ''
    try {
      if (cleanLang && hljs.getLanguage(cleanLang)) {
        return hljs.highlight(code, { language: cleanLang, ignoreIllegals: true }).value
      }
      return hljs.highlightAuto(code).value
    } catch {
      // Safe fallback: HTML entity escape
      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }
  }, [code, cleanLang])

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang-label">{displayLang}</span>
        <button
          type="button"
          className={`code-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
          title="Copy code"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="code-block-content">
        <pre>
          <code
            className={`hljs ${cleanLang ? `language-${cleanLang}` : ''}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  )
}
