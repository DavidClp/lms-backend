/**
 * Parser de arquivos .docx no formato gerado pela IA para aulas.
 * Converte parágrafos e tabelas do Word em ContentBlock[] compatível com lessons.
 */

import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

type TextBlock = { type: 'TEXT'; value: string }
type SectionBlock = {
  type: 'SECTION'
  level: 1 | 2
  eyebrow?: string
  title: string
  subtitle?: string
}
type CalloutBlock = {
  type: 'CALLOUT'
  variant: 'tip' | 'example' | 'warning' | 'note' | 'exercise'
  icon?: string
  title?: string
  value: string
}
type ActivityChecklistBlock = { type: 'ACTIVITY_CHECKLIST'; title?: string; items: string[] }
type ImagesBlock = {
  type: 'IMAGES'
  images: Array<{ id: string; caption?: string }>
  cardWithBorder?: boolean
  imageLayout?: 'column' | 'row'
  placeholder?: { title: string; description: string }
}
type QuizBlock = {
  type: 'QUIZ'
  questions: Array<{
    id: string
    question: string
    options: Array<{ id: string; text: string }>
    correctOptionId: string
    explanation?: string
  }>
}
type TableBlock = { type: 'TABLE'; caption?: string; headers: string[]; rows: string[][] }

export type ParsedContentBlock =
  | TextBlock
  | SectionBlock
  | CalloutBlock
  | ActivityChecklistBlock
  | ImagesBlock
  | QuizBlock
  | TableBlock

export interface ParsedLesson {
  title: string
  content: ParsedContentBlock[]
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  isArray: (name) => ['p', 'r', 't', 'tr', 'tc', 'tbl', 'style'].includes(name),
})

type XmlNode = Record<string, unknown>

function asArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined) return []
  return Array.isArray(val) ? val : [val]
}

function getAttr(node: XmlNode | undefined, attr: string): string | undefined {
  if (!node) return undefined
  const v = node[`@_${attr}`]
  return typeof v === 'string' ? v : undefined
}

function normalizeFill(fill: string | undefined): string {
  return (fill ?? '').toUpperCase().replace(/^#/, '')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripLeadingEmoji(text: string): { icon?: string; rest: string } {
  const trimmed = text.trim()
  const m = trimmed.match(/^(\p{Extended_Pictographic}(?:\uFE0F)?)\s*(.*)$/u)
  if (m) return { icon: m[1], rest: m[2].trim() }
  return { rest: trimmed }
}

interface RunStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  fontSize?: number
}

interface ParsedParagraph {
  text: string
  html: string
  styleName?: string
  numId?: string
  align?: string
  isBoldAll?: boolean
  color?: string
  fontSize?: number
  isEmpty: boolean
  /** Espaço após o parágrafo em twips (1/20 pt), definido no Word via w:spacing/@w:after */
  spacingAfter?: number
  /** Word suprime espaço entre parágrafos consecutivos do mesmo estilo */
  contextualSpacing?: boolean
}

interface ParagraphStyleInfo {
  basedOn?: string
  spacingAfter?: number
  contextualSpacing?: boolean
}

/** Resolve espaçamento de parágrafo a partir de word/styles.xml */
class DocxStyleResolver {
  private styles = new Map<string, ParagraphStyleInfo>()
  private defaultSpacingAfter?: number
  private defaultContextualSpacing = false

  static empty(): DocxStyleResolver {
    return new DocxStyleResolver()
  }

  static fromZip(zip: AdmZip): DocxStyleResolver {
    const resolver = new DocxStyleResolver()
    const entry = zip.getEntry('word/styles.xml')
    if (!entry) return resolver

    const parsed = xmlParser.parse(entry.getData().toString('utf8')) as XmlNode
    const stylesRoot = parsed.styles as XmlNode | undefined
    if (!stylesRoot) return resolver

    const pPrDefault = (stylesRoot.docDefaults as XmlNode | undefined)?.pPrDefault as
      | XmlNode
      | undefined
    resolver.readPPr(pPrDefault?.pPr as XmlNode | undefined, resolver, true)

    for (const style of asArray<XmlNode>(stylesRoot.style as XmlNode | XmlNode[])) {
      if (getAttr(style, 'type') !== 'paragraph') continue
      const styleId = getAttr(style, 'styleId')
      if (!styleId) continue
      const info: ParagraphStyleInfo = { basedOn: getAttr(style.basedOn as XmlNode, 'val') }
      resolver.readPPr(style.pPr as XmlNode | undefined, info, false)
      resolver.styles.set(styleId, info)
    }

    return resolver
  }

  private readPPr(
    pPr: XmlNode | undefined,
    target: DocxStyleResolver | ParagraphStyleInfo,
    isDefault: boolean,
  ): void {
    if (!pPr) return
    const spacingAfter = parseSpacingAfter(pPr)
    const contextualSpacing = pPr.contextualSpacing !== undefined

    if (isDefault && target instanceof DocxStyleResolver) {
      if (spacingAfter !== undefined && !Number.isNaN(spacingAfter)) {
        target.defaultSpacingAfter = spacingAfter
      }
      if (contextualSpacing) target.defaultContextualSpacing = true
      return
    }

    const info = target as ParagraphStyleInfo
    if (spacingAfter !== undefined && !Number.isNaN(spacingAfter)) info.spacingAfter = spacingAfter
    if (contextualSpacing) info.contextualSpacing = true
  }

  resolveSpacingAfter(styleId: string | undefined, direct?: number): number | undefined {
    if (direct !== undefined && !Number.isNaN(direct)) return direct
    const fromStyle = this.walkStyleChain(styleId, (info) => info.spacingAfter)
    if (fromStyle !== undefined) return fromStyle
    return this.defaultSpacingAfter
  }

  resolveContextualSpacing(styleId: string | undefined, direct?: boolean): boolean {
    if (direct !== undefined) return direct
    const fromStyle = this.walkStyleChain(styleId, (info) => info.contextualSpacing)
    if (fromStyle !== undefined) return fromStyle
    return this.defaultContextualSpacing
  }

  private walkStyleChain<T>(
    styleId: string | undefined,
    pick: (info: ParagraphStyleInfo) => T | undefined,
  ): T | undefined {
    let current = styleId ?? 'Normal'
    const visited = new Set<string>()
    while (current && !visited.has(current)) {
      visited.add(current)
      const info = this.styles.get(current)
      if (!info) break
      const value = pick(info)
      if (value !== undefined) return value
      current = info.basedOn ?? ''
    }
    return undefined
  }
}

let activeStyleResolver: DocxStyleResolver = DocxStyleResolver.empty()

function getRunText(run: XmlNode): string {
  const texts = asArray<XmlNode>(run.t as XmlNode | XmlNode[])
  let result = texts.map((t) => (typeof t['#text'] === 'string' ? t['#text'] : '')).join('')
  if (run.br !== undefined) result += '\n'
  return result
}

function getRunStyle(run: XmlNode): RunStyle {
  const rPr = run.rPr as XmlNode | undefined
  if (!rPr) return {}
  const colorVal = getAttr(rPr.color as XmlNode, 'val')
  const szVal = getAttr(rPr.sz as XmlNode, 'val')
  return {
    bold: rPr.b !== undefined,
    italic: rPr.i !== undefined,
    underline: rPr.u !== undefined,
    color: colorVal && colorVal !== 'auto' ? `#${colorVal}` : undefined,
    fontSize: szVal ? Math.round(parseInt(szVal, 10) / 2) : undefined,
  }
}

function applyRunStyle(text: string, style: RunStyle): string {
  if (!text) return ''
  let html = escapeHtml(text)
  const spanStyles: string[] = []
  if (style.color) spanStyles.push(`color:${style.color}`)
  // Tamanho de fonte fica a cargo do CSS do player (16px padrão), não do Word.
  if (spanStyles.length) html = `<span style="${spanStyles.join(';')}">${html}</span>`
  if (style.bold) html = `<strong>${html}</strong>`
  if (style.italic) html = `<em>${html}</em>`
  if (style.underline) html = `<u>${html}</u>`
  return html
}

/** Twips com espaço explícito após parágrafo (≈6pt ou mais) — comum em docs com linha em branco visual */
const SPACING_AFTER_THRESHOLD = 120

function parseSpacingAfter(pPr: XmlNode | undefined): number | undefined {
  const spacing = pPr?.spacing as XmlNode | undefined
  if (!spacing) return undefined
  const afterLinesRaw = getAttr(spacing, 'afterLines')
  if (afterLinesRaw) {
    const afterLines = parseInt(afterLinesRaw, 10)
    if (!Number.isNaN(afterLines) && afterLines >= 50) return SPACING_AFTER_THRESHOLD
  }
  const afterRaw = getAttr(spacing, 'after')
  if (!afterRaw) return undefined
  const after = parseInt(afterRaw, 10)
  return Number.isNaN(after) ? undefined : after
}

function parseParagraph(p: XmlNode): ParsedParagraph {
  const pPr = p.pPr as XmlNode | undefined
  const styleName = getAttr(pPr?.pStyle as XmlNode, 'val')
  const numPr = pPr?.numPr as XmlNode | undefined
  const numId = getAttr(numPr?.numId as XmlNode, 'val')
  const align = getAttr(pPr?.jc as XmlNode, 'val')
  const directSpacingAfter = parseSpacingAfter(pPr)
  const directContextualSpacing = pPr?.contextualSpacing !== undefined ? true : undefined

  const runs = asArray<XmlNode>(p.r as XmlNode | XmlNode[])
  let text = ''
  let html = ''
  let allBold = runs.length > 0
  let dominantColor: string | undefined
  let dominantSize: number | undefined

  for (const run of runs) {
    const runText = getRunText(run)
    const style = getRunStyle(run)
    text += runText
    html += applyRunStyle(runText, style)
    if (!style.bold) allBold = false
    if (style.color) dominantColor = style.color
    if (style.fontSize) dominantSize = style.fontSize
  }

  const trimmed = text.trim()
  return {
    text: trimmed,
    html: trimmed ? `<p>${html}</p>` : '',
    styleName,
    numId: numId ? String(numId) : undefined,
    align,
    isBoldAll: allBold && trimmed.length > 0,
    color: dominantColor,
    fontSize: dominantSize,
    isEmpty: trimmed.length === 0,
    spacingAfter: activeStyleResolver.resolveSpacingAfter(styleName, directSpacingAfter),
    contextualSpacing: activeStyleResolver.resolveContextualSpacing(
      styleName,
      directContextualSpacing,
    ),
  }
}

/** Linha em branco entre parágrafos (compatível com o editor rich-text) */
const BLANK_LINE_HTML = '<p><br></p>'

function getTableFirstCellFill(tbl: XmlNode): string {
  const rows = asArray<XmlNode>(tbl.tr as XmlNode | XmlNode[])
  if (rows.length === 0) return ''
  const cells = asArray<XmlNode>(rows[0].tc as XmlNode | XmlNode[])
  if (cells.length === 0) return ''
  const tcPr = cells[0].tcPr as XmlNode | undefined
  const shd = tcPr?.shd as XmlNode | undefined
  return normalizeFill(getAttr(shd, 'fill'))
}

function getTableDimensions(tbl: XmlNode): { rows: number; cols: number } {
  const rows = asArray<XmlNode>(tbl.tr as XmlNode | XmlNode[])
  const cols = rows.length > 0 ? asArray<XmlNode>(rows[0].tc as XmlNode | XmlNode[]).length : 0
  return { rows: rows.length, cols }
}

function getCellParagraphs(tc: XmlNode): ParsedParagraph[] {
  return asArray<XmlNode>(tc.p as XmlNode | XmlNode[]).map(parseParagraph)
}

function getTableCellText(tc: XmlNode): string {
  return getCellParagraphs(tc)
    .map((p) => p.text)
    .filter(Boolean)
    .join(' ')
}

function paragraphsToHtml(paragraphs: ParsedParagraph[]): string {
  const parts: string[] = []
  let bulletItems: string[] = []
  let orderedItems: string[] = []

  const flushBullets = () => {
    if (bulletItems.length) {
      parts.push(`<ul>${bulletItems.map((i) => `<li>${i}</li>`).join('')}</ul>`)
      bulletItems = []
    }
  }
  const flushOrdered = () => {
    if (orderedItems.length) {
      parts.push(`<ol>${orderedItems.map((i) => `<li>${i}</li>`).join('')}</ol>`)
      orderedItems = []
    }
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]
    if (p.isEmpty) {
      flushBullets()
      flushOrdered()
      parts.push(BLANK_LINE_HTML)
      continue
    }
    const inner = p.html.replace(/^<p>/, '').replace(/<\/p>$/, '')

    if (p.numId === '2') {
      flushOrdered()
      bulletItems.push(inner)
      continue
    }
    if (p.numId === '3') {
      flushBullets()
      orderedItems.push(inner)
      continue
    }

    flushBullets()
    flushOrdered()
    parts.push(p.html)

    const next = paragraphs[i + 1]
    const hasExplicitGapAfter =
      p.spacingAfter !== undefined && p.spacingAfter >= SPACING_AFTER_THRESHOLD
    const sameStyleAsNext =
      next !== undefined &&
      !next.isEmpty &&
      p.styleName !== undefined &&
      p.styleName === next.styleName
    const suppressGap = sameStyleAsNext && p.contextualSpacing
    if (hasExplicitGapAfter && next !== undefined && !next.isEmpty && !suppressGap) {
      parts.push(BLANK_LINE_HTML)
    }
  }

  flushBullets()
  flushOrdered()
  return parts.join('')
}

const FILL_CALLOUT_GREEN = 'E6F4EA'
const FILL_EXERCISE_BLUE = 'EAF2FB'
const FILL_IMAGE_YELLOW = 'FFF3CD'
const FILL_TABLE_HEADER = '1E7145'

function detectCalloutVariant(title: string): CalloutBlock['variant'] {
  const lower = title.toLowerCase()
  if (/estrutura|exemplo/.test(lower)) return 'example'
  if (/cuidado|atenção|atenç|cautela/.test(lower)) return 'warning'
  return 'tip'
}

function parseCalloutTable(tbl: XmlNode): CalloutBlock {
  const rows = asArray<XmlNode>(tbl.tr as XmlNode | XmlNode[])
  const paragraphs = rows.flatMap((row) =>
    asArray<XmlNode>(row.tc as XmlNode | XmlNode[]).flatMap(getCellParagraphs),
  )
  const nonEmpty = paragraphs.filter((p) => !p.isEmpty)
  const first = nonEmpty[0]
  const { icon, rest: titleRest } = stripLeadingEmoji(first?.text ?? '')
  const title = titleRest || undefined
  const bodyParagraphs = nonEmpty.slice(1)
  const value = bodyParagraphs.length
    ? paragraphsToHtml(bodyParagraphs)
    : paragraphsToHtml(nonEmpty)
  return {
    type: 'CALLOUT',
    variant: detectCalloutVariant(title ?? first?.text ?? ''),
    icon,
    title,
    value,
  }
}

function parseChecklistTable(tbl: XmlNode): ActivityChecklistBlock {
  const rows = asArray<XmlNode>(tbl.tr as XmlNode | XmlNode[])
  const paragraphs = rows.flatMap((row) =>
    asArray<XmlNode>(row.tc as XmlNode | XmlNode[]).flatMap(getCellParagraphs),
  )
  const nonEmpty = paragraphs.filter((p) => !p.isEmpty)
  const first = nonEmpty[0]
  const { rest: titleText } = stripLeadingEmoji(first?.text ?? '')
  const items = nonEmpty.slice(1).map((p) => p.text)
  return {
    type: 'ACTIVITY_CHECKLIST',
    title: titleText || undefined,
    items: items.length ? items : [titleText],
  }
}

function parseImagePlaceholderTable(tbl: XmlNode): ImagesBlock {
  const rows = asArray<XmlNode>(tbl.tr as XmlNode | XmlNode[])
  const text = rows
    .flatMap((row) => asArray<XmlNode>(row.tc as XmlNode | XmlNode[]).map(getTableCellText))
    .join(' ')
  const cleaned = text.replace(/INSERIR\s+IMAGEM\s*[-—]?\s*/i, '').trim()
  const dashIdx = cleaned.search(/\s[-—]\s/)
  let title = cleaned
  let description = ''
  if (dashIdx > 0) {
    title = cleaned.slice(0, dashIdx).trim()
    description = cleaned.slice(dashIdx).replace(/^[\s—-]+/, '').trim()
  }
  const { rest: titleWithoutEmoji } = stripLeadingEmoji(title)
  return {
    type: 'IMAGES',
    images: [],
    cardWithBorder: true,
    imageLayout: 'column',
    placeholder: {
      title: titleWithoutEmoji || 'Imagem pendente',
      description: description || titleWithoutEmoji,
    },
  }
}

function parseDataTable(tbl: XmlNode): TableBlock {
  const rows = asArray<XmlNode>(tbl.tr as XmlNode | XmlNode[])
  const allRows = rows.map((row) =>
    asArray<XmlNode>(row.tc as XmlNode | XmlNode[]).map(getTableCellText),
  )
  if (allRows.length === 0) return { type: 'TABLE', headers: [], rows: [] }
  const headers = allRows[0]
  const dataRows = allRows.slice(1)
  return { type: 'TABLE', headers, rows: dataRows }
}

function parseGenericSingleCellTable(tbl: XmlNode): CalloutBlock {
  const rows = asArray<XmlNode>(tbl.tr as XmlNode | XmlNode[])
  const paragraphs = rows.flatMap((row) =>
    asArray<XmlNode>(row.tc as XmlNode | XmlNode[]).flatMap(getCellParagraphs),
  )
  return {
    type: 'CALLOUT',
    variant: 'note',
    value: paragraphsToHtml(paragraphs.filter((p) => !p.isEmpty)),
  }
}

const QUESTION_REGEX = /^Quest[aã]o\s+(\d+)\s*[-–—]\s*(.+)$/i
const OPTION_REGEX = /^([a-d])\)\s*(.+)$/i
const ANSWER_REGEX = /^Resposta\s+correta:\s*([a-d])\)\s*(.+)$/i

interface QuizBuilder {
  questions: QuizBlock['questions']
  current: {
    id: string
    question: string
    options: Array<{ id: string; text: string }>
    correctOptionId: string
    explanation?: string
  } | null
}

function createQuizBuilder(): QuizBuilder {
  return { questions: [], current: null }
}

function flushQuizQuestion(builder: QuizBuilder): void {
  if (!builder.current) return
  if (builder.current.options.length === 0) return
  if (!builder.current.correctOptionId && builder.current.options.length > 0) {
    builder.current.correctOptionId = builder.current.options[0].id
  }
  builder.questions.push({ ...builder.current })
  builder.current = null
}

function parseQuizParagraph(p: ParsedParagraph, builder: QuizBuilder): boolean {
  const qMatch = p.text.match(QUESTION_REGEX)
  if (qMatch) {
    flushQuizQuestion(builder)
    builder.current = {
      id: `q-${qMatch[1]}`,
      question: qMatch[2].trim(),
      options: [],
      correctOptionId: '',
    }
    return true
  }

  const optMatch = p.text.match(OPTION_REGEX)
  if (optMatch && builder.current) {
    const letter = optMatch[1].toLowerCase()
    builder.current.options.push({ id: letter, text: optMatch[2].trim() })
    return true
  }

  const ansMatch = p.text.match(ANSWER_REGEX)
  if (ansMatch && builder.current) {
    const letter = ansMatch[1].toLowerCase()
    builder.current.correctOptionId = letter
    const rest = ansMatch[2].trim()
    const dotIdx = rest.indexOf('.')
    if (dotIdx >= 0 && dotIdx < rest.length - 1) {
      builder.current.explanation = rest.slice(dotIdx + 1).trim()
    }
    flushQuizQuestion(builder)
    return true
  }

  return false
}

function isQuizSectionStart(p: ParsedParagraph): boolean {
  return /^QUIZ\s+\d+/i.test(p.text)
}

function isQuizHeading(p: ParsedParagraph): boolean {
  return p.styleName === 'Heading1' && /quiz/i.test(p.text)
}

function isQuizIntroParagraph(p: ParsedParagraph): boolean {
  return /responda\s+as\s+quest/i.test(p.text)
}

const EYEBROW_COLOR = '#0E7C7B'

function isEyebrow(p: ParsedParagraph): boolean {
  if (!p.isBoldAll) return false
  if (p.color === EYEBROW_COLOR) return true
  return /^(AULA\s+\d|LEITURA\s+COMPLEMENTAR|ATIVIDADE\s+PRÁTICA|QUIZ\s+\d|RESUMO\s+DO)/i.test(p.text)
}

function extractTopLevelElementXml(bodyContent: string, start: number): { tag: 'p' | 'tbl'; xml: string; end: number } | null {
  const pStart = bodyContent.indexOf('<w:p', start)
  const tblStart = bodyContent.indexOf('<w:tbl', start)
  const sectStart = bodyContent.indexOf('<w:sectPr', start)

  let tagStart = -1
  let tag: 'p' | 'tbl' = 'p'

  if (pStart === -1 && tblStart === -1) return null
  if (pStart >= 0 && (tblStart < 0 || pStart < tblStart)) {
    tagStart = pStart
    tag = 'p'
  } else {
    tagStart = tblStart
    tag = 'tbl'
  }

  if (sectStart >= 0 && sectStart < tagStart) return null

  const openPattern = new RegExp(`<w:${tag}(?:\\s[^>]*)?>`, 'g')
  openPattern.lastIndex = tagStart
  const openMatch = openPattern.exec(bodyContent)
  if (!openMatch) return null

  let depth = 0
  let pos = tagStart
  const tokenRegex = new RegExp(`<\\/w:${tag}>|<w:${tag}(?:\\s[^>]*)?>`, 'g')
  tokenRegex.lastIndex = pos

  let tokenMatch: RegExpExecArray | null
  while ((tokenMatch = tokenRegex.exec(bodyContent)) !== null) {
    if (tokenMatch[0].startsWith(`</w:${tag}>`)) {
      depth--
      if (depth === 0) {
        const end = tokenMatch.index + tokenMatch[0].length
        return { tag, xml: bodyContent.slice(tagStart, end), end }
      }
    } else {
      depth++
    }
  }
  return null
}

export function extractBodyElementsFromXml(xml: string): XmlNode[] {
  const bodyMatch = xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)
  if (!bodyMatch) return []

  const bodyContent = bodyMatch[1]
  const elements: XmlNode[] = []
  let pos = 0

  while (pos < bodyContent.length) {
    const extracted = extractTopLevelElementXml(bodyContent, pos)
    if (!extracted) break
    const wrapped = `<?xml version="1.0" encoding="UTF-8"?><root xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${extracted.xml}</root>`
    const parsed = xmlParser.parse(wrapped) as XmlNode
    const root = parsed.root as XmlNode | undefined
    let node = (root?.[extracted.tag] ?? parsed[extracted.tag]) as XmlNode | XmlNode[]
    if (Array.isArray(node)) node = node[0]
    elements.push(node)
    pos = extracted.end
  }

  return elements
}

class DocxLessonParser {
  private blocks: ParsedContentBlock[] = []
  private textBuffer: ParsedParagraph[] = []
  private lessonTitle = 'Aula importada'
  private titleSet = false
  private pendingEyebrow: string | null = null
  private inQuiz = false
  private quizBuilder = createQuizBuilder()
  private coverParagraphs: ParsedParagraph[] = []
  private coverDone = false

  private flushText(): void {
    if (this.textBuffer.length === 0) return
    const hasContent = this.textBuffer.some((p) => !p.isEmpty)
    if (!hasContent) {
      this.textBuffer = []
      return
    }
    const html = paragraphsToHtml(this.textBuffer)
    if (html.trim()) {
      this.blocks.push({ type: 'TEXT', value: html })
    }
    this.textBuffer = []
  }

  private flushQuiz(): void {
    flushQuizQuestion(this.quizBuilder)
    if (this.quizBuilder.questions.length > 0) {
      this.blocks.push({ type: 'QUIZ', questions: this.quizBuilder.questions })
    }
    this.quizBuilder = createQuizBuilder()
    this.inQuiz = false
  }

  private addSection(level: 1 | 2, title: string, subtitle?: string): void {
    this.flushText()
    this.blocks.push({
      type: 'SECTION',
      level,
      eyebrow: this.pendingEyebrow ?? undefined,
      title,
      subtitle,
    })
    this.pendingEyebrow = null
  }

  private processCoverIfNeeded(): void {
    if (this.coverDone || this.coverParagraphs.length < 3) return
    this.coverDone = true
    const centered = this.coverParagraphs.filter((p) => p.align === 'center' && !p.isEmpty)
    if (centered.length >= 3) {
      const mainTitle = centered[2]?.text ?? centered[centered.length - 1]?.text
      if (mainTitle && !this.titleSet) {
        this.lessonTitle = mainTitle
        this.titleSet = true
      }
      const eyebrow = centered[0]?.text
      const subtitle = centered[3]?.text ?? centered[1]?.text
      this.addSection(1, mainTitle ?? 'Aula importada', subtitle !== mainTitle ? subtitle : undefined)
      if (eyebrow && eyebrow !== mainTitle) {
        const last = this.blocks[this.blocks.length - 1] as SectionBlock
        if (last.type === 'SECTION') last.eyebrow = eyebrow
      }
    }
  }

  private handleParagraph(p: ParsedParagraph): void {
    if (!this.coverDone && p.align === 'center') {
      this.coverParagraphs.push(p)
      return
    }

    if (!this.coverDone && this.coverParagraphs.length > 0) {
      this.processCoverIfNeeded()
    }

    if (p.isEmpty) {
      this.textBuffer.push(p)
      return
    }

    if (isEyebrow(p)) {
      this.flushText()
      this.pendingEyebrow = p.text
      return
    }

    if (isQuizSectionStart(p) || isQuizHeading(p)) {
      this.flushText()
      this.inQuiz = true
      if (p.styleName === 'Heading1') {
        this.addSection(1, p.text)
      }
      return
    }

    if (this.inQuiz) {
      if (p.styleName === 'Heading1' && !/quest[aã]o/i.test(p.text)) {
        this.flushQuiz()
      } else if (
        parseQuizParagraph(p, this.quizBuilder) ||
        (/^Quest[aã]o\s+\d+/i.test(p.text) && parseQuizParagraph(p, this.quizBuilder)) ||
        (/^[a-d]\)/i.test(p.text) && parseQuizParagraph(p, this.quizBuilder)) ||
        (/^Resposta\s+correta/i.test(p.text) && parseQuizParagraph(p, this.quizBuilder))
      ) {
        return
      }
      if (!isQuizIntroParagraph(p)) {
        this.textBuffer.push(p)
      }
      return
    }

    if (p.styleName === 'Heading1') {
      this.addSection(1, p.text)
      return
    }

    if (p.styleName === 'Heading2') {
      this.addSection(2, p.text)
      return
    }

    this.textBuffer.push(p)
  }

  private handleTable(tbl: XmlNode): void {
    if (!this.coverDone && this.coverParagraphs.length > 0) {
      this.processCoverIfNeeded()
    }

    this.flushText()
    // Durante o quiz, ignorar tabelas inseridas no fluxo (não há tabelas reais na seção de quiz)
    if (this.inQuiz) return

    const fill = getTableFirstCellFill(tbl)
    const { rows, cols } = getTableDimensions(tbl)

    if (rows === 1 && cols === 1) {
      if (fill === FILL_CALLOUT_GREEN) {
        this.blocks.push(parseCalloutTable(tbl))
        return
      }
      if (fill === FILL_EXERCISE_BLUE) {
        this.blocks.push(parseChecklistTable(tbl))
        return
      }
      if (fill === FILL_IMAGE_YELLOW) {
        this.blocks.push(parseImagePlaceholderTable(tbl))
        return
      }
      this.blocks.push(parseGenericSingleCellTable(tbl))
      return
    }

    if (fill === FILL_TABLE_HEADER || rows > 1) {
      this.blocks.push(parseDataTable(tbl))
      return
    }

    this.blocks.push(parseDataTable(tbl))
  }

  parseElements(elements: XmlNode[]): void {
    for (const el of elements) {
      if (el.tr !== undefined) {
        this.handleTable(el)
      } else {
        this.handleParagraph(parseParagraph(el))
      }
    }

    if (!this.coverDone && this.coverParagraphs.length > 0) {
      this.processCoverIfNeeded()
    }
    this.flushText()
    if (this.inQuiz) this.flushQuiz()
  }

  getResult(): ParsedLesson {
    return { title: this.lessonTitle, content: this.blocks }
  }
}

/**
 * Parseia um buffer .docx e retorna título e array de blocos para a aula.
 */
export function parseDocxLesson(buffer: Buffer): ParsedLesson {
  const zip = new AdmZip(buffer)
  const entry = zip.getEntry('word/document.xml')
  if (!entry) {
    throw new Error('Arquivo .docx inválido: word/document.xml não encontrado')
  }

  const xml = entry.getData().toString('utf8')
  const elements = extractBodyElementsFromXml(xml)

  if (elements.length === 0) {
    throw new Error('Arquivo .docx inválido: corpo do documento vazio')
  }

  activeStyleResolver = DocxStyleResolver.fromZip(zip)
  try {
    const parser = new DocxLessonParser()
    parser.parseElements(elements)
    return parser.getResult()
  } finally {
    activeStyleResolver = DocxStyleResolver.empty()
  }
}
