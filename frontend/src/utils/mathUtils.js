/**
 * Preprocesses markdown text to ensure LaTeX math formulas
 * render correctly in react-markdown with remark-math and rehype-katex,
 * while safely preserving code blocks and standard text untouched.
 */
export function normalizeMarkdown(content) {
  if (!content || typeof content !== 'string') return ''

  // Split by fenced code blocks (```...```) and inline code (`...`)
  // so math transformations are never applied inside code.
  const parts = content.split(/(```[\s\S]*?```|`[^`\n]+`)/g)

  return parts
    .map((part, index) => {
      // Odd indices are code blocks or inline code -> preserve exactly as-is
      if (index % 2 === 1) {
        return part
      }

      let text = part

      // 1. Convert LaTeX display math \[ ... \] to $$ ... $$
      text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
        return `\n\n$$\n${math.trim()}\n$$\n\n`
      })

      // 2. Convert LaTeX inline math \( ... \) to $ ... $
      text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
        return `$${math.trim()}$`
      })

      // 3. Ensure $$ display math blocks have newlines before and after
      // so remark-math parses them as block math instead of inline math.
      // Use function replacements so JS doesn't treat $$ as a single $.
      text = text.replace(/([^\n])\n?\$\$/g, (_, prefix) => `${prefix}\n\n$$`)
      text = text.replace(/\$\$\n?([^\n])/g, (_, suffix) => `$$\n\n${suffix}`)

      return text
    })
    .join('')
}
