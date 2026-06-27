/**
 * Lezer (CodeMirror 6) 静态语法高亮引擎
 *
 * 使用 Lezer 解析器 + @lezer/highlight 的 highlightCode() API
 * 生成带 cm-* class 的 HTML，与 M3 的 CodeMirror CSS 主题无缝匹配。
 *
 * 支持的语言（Lezer 原生语法）：
 *   javascript, js, typescript, ts, html, css, json, python, py, java, xml, markdown, md
 *
 * 不支持的语言（回退到 hljs）：
 *   bash, shell, sh, yaml, yml, sql, jsx, tsx
 */

import { highlightCode, tagHighlighter, tags } from '@lezer/highlight'

// ===== Lezer 解析器导入 =====
import { parser as jsParser } from '@lezer/javascript'
import { parser as htmlParser } from '@lezer/html'
import { parser as cssParser } from '@lezer/css'
import { parser as jsonParser } from '@lezer/json'
import { parser as pythonParser } from '@lezer/python'
import { parser as javaParser } from '@lezer/java'
import { parser as xmlParser } from '@lezer/xml'

// ===== TypeScript 方言配置 =====
const tsParser = jsParser.configure({ dialect: 'ts' })

// ===== M3 tag → cm-* class 映射 =====
// 对照 CodeMirror 5 cm-s-neo 主题的 token 类名
const m3Highlighter = tagHighlighter([
  // 核心语义 tokens
  { tag: tags.keyword, class: 'cm-keyword' },
  { tag: tags.atom, class: 'cm-atom' },
  { tag: tags.bool, class: 'cm-atom' },
  { tag: tags.number, class: 'cm-number' },
  { tag: tags.string, class: 'cm-string' },
  { tag: tags.comment, class: 'cm-comment' },
  { tag: tags.variableName, class: 'cm-variable' },
  { tag: tags.definition(tags.variableName), class: 'cm-def' },
  { tag: tags.local(tags.variableName), class: 'cm-variable' },
  { tag: tags.special(tags.variableName), class: 'cm-variable-2' },
  { tag: tags.propertyName, class: 'cm-property' },
  { tag: tags.definition(tags.propertyName), class: 'cm-property' },
  { tag: tags.operator, class: 'cm-operator' },
  { tag: tags.punctuation, class: 'cm-operator' },

  // 类型 / 类名
  { tag: tags.typeName, class: 'cm-variable-2' },
  { tag: tags.definition(tags.typeName), class: 'cm-def' },
  { tag: tags.className, class: 'cm-variable-2' },
  { tag: tags.definition(tags.className), class: 'cm-def' },

  // 其他语义 tokens
  { tag: tags.labelName, class: 'cm-variable' },
  { tag: tags.namespace, class: 'cm-variable-2' },
  { tag: tags.macroName, class: 'cm-variable-2' },
  { tag: tags.literal, class: 'cm-number' },

  // 字符串变体
  { tag: tags.regexp, class: 'cm-string-2' },
  { tag: tags.escape, class: 'cm-string-2' },
  { tag: tags.special(tags.string), class: 'cm-string-2' },

  // 变更标记
  { tag: tags.inserted, class: 'cm-string' },
  { tag: tags.deleted, class: 'cm-string' },

  // Markdown 相关
  { tag: tags.strong, class: 'cm-strong' },
  { tag: tags.emphasis, class: 'cm-em' },
  { tag: tags.link, class: 'cm-link' },
  { tag: tags.heading, class: 'cm-header' },
  { tag: tags.url, class: 'cm-url' },

  // 元信息
  { tag: tags.meta, class: 'cm-meta' },
  { tag: tags.processingInstruction, class: 'cm-meta' },
  { tag: tags.invalid, class: 'cm-error' },
])

// ===== 语言名 → 解析器映射 =====
const parserMap = {
  javascript: jsParser,
  js: jsParser,
  typescript: tsParser,
  ts: tsParser,
  html: htmlParser,
  css: cssParser,
  json: jsonParser,
  python: pythonParser,
  py: pythonParser,
  java: javaParser,
  xml: xmlParser,
}

// 不可用 Lezer 的语言（回退到 hljs）
const hljsOnlyLangs = new Set(['bash', 'shell', 'sh', 'yaml', 'yml', 'sql', 'jsx', 'tsx'])

/**
 * 检查语言是否支持 Lezer 高亮
 * @param {string} lang - Markdown 代码块语言标识
 * @returns {boolean}
 */
export function isLezerSupported(lang) {
  return lang in parserMap
}

/**
 * 使用 Lezer 进行静态语法高亮，输出带 cm-* class 的 HTML
 *
 * @param {string} code - 源代码文本
 * @param {string} lang - 语言标识（如 'javascript', 'python' 等）
 * @returns {string} 高亮后的 HTML（不含 <pre> 包装）
 */
export function highlightWithLezer(code, lang) {
  const parser = parserMap[lang]
  if (!parser) return null

  try {
    const tree = parser.parse(code)
    let html = ''

    highlightCode(
      code,
      tree,
      m3Highlighter,
      // putText: 每个文本片段调用
      (text, classes) => {
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        if (classes) {
          html += `<span class="${classes}">${escaped}</span>`
        } else {
          html += escaped
        }
      },
      // putBreak: 每个换行处调用
      () => { html += '\n' }
    )

    return html
  } catch (e) {
    console.warn(`[LezerHighlight] Failed to parse ${lang}:`, e)
    return null
  }
}
