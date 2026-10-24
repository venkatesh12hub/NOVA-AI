import React, { Component, memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import CodeBlock from './CodeBlock'
import { normalizeMarkdown } from '../utils/mathUtils'

// Robust Error Boundary to catch any math or markdown parsing exceptions safely
class MarkdownErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.warn('Markdown rendering caught error, falling back to clean text:', error, info)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.content !== this.props.content && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="markdown-fallback">{this.props.content}</div>
    }
    return this.props.children
  }
}

// Custom component mappings for ReactMarkdown
const markdownComponents = {
  // Multiline code blocks intercepted by pre
  pre({ children }) {
    if (React.isValidElement(children)) {
      const className = children.props?.className || ''
      const match = /language-([a-zA-Z0-9_-]+)/.exec(className)
      const code = String(children.props?.children || '').replace(/\n$/, '')
      return <CodeBlock language={match ? match[1] : ''} code={code} />
    }
    return <pre className="raw-pre">{children}</pre>
  },

  // Inline code snippets
  code({ className, children, ...props }) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    )
  },

  // Responsive scrollable tables
  table({ children }) {
    return (
      <div className="table-container">
        <table className="markdown-table">{children}</table>
      </div>
    )
  },

  // Safe external links
  a({ href, children, ...props }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link" {...props}>
        {children}
      </a>
    )
  },

  // Styled blockquotes
  blockquote({ children }) {
    return <blockquote className="markdown-blockquote">{children}</blockquote>
  },

  // Styled lists
  ul({ children, ...props }) {
    return (
      <ul className="markdown-ul" {...props}>
        {children}
      </ul>
    )
  },

  ol({ children, ...props }) {
    return (
      <ol className="markdown-ol" {...props}>
        {children}
      </ol>
    )
  },

  li({ children, ...props }) {
    return (
      <li className="markdown-li" {...props}>
        {children}
      </li>
    )
  },

  // Clean heading elements
  h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
  h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
  h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
  h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,
  hr: () => <hr className="markdown-hr" />,
}

function MarkdownRendererBase({ content = '', isStreaming = false }) {
  const normalized = useMemo(() => normalizeMarkdown(content), [content])

  return (
    <MarkdownErrorBoundary content={content}>
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: '#ef4444' }]]}
          components={markdownComponents}
        >
          {normalized}
        </ReactMarkdown>
        {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
      </div>
    </MarkdownErrorBoundary>
  )
}

export default memo(MarkdownRendererBase)
