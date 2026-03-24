/**
 * Parser de arquivos .md no formato gerado pela IA para aulas.
 * Converte blocos "# ✦ BLOCO N — TIPO" em ContentBlock[] compatível com a tabela lessons.
 */

import { randomUUID } from 'crypto'

const BLOCK_HEADER_REGEX = /^# ✦ BLOCO \d+ — ([^\n]+)/gm

const IMAGEM_PLACEHOLDER_REGEX = />?\s*💡?\s*\*?\[IMAGEM:\s*([^\]]*)\]\s*\*?\s*/gi

type TextBlock = { type: 'TEXT'; value: string }
type VideoBlock = { type: 'VIDEO'; url: string; title?: string; startSeconds?: number; endSeconds?: number }
type ActivityChecklistBlock = { type: 'ACTIVITY_CHECKLIST'; title?: string; items: string[] }
type ImagesBlock = {
  type: 'IMAGES'
  images: Array<{ id: string; caption?: string }>
  cardWithBorder?: boolean
  imageLayout?: 'column' | 'row'
}
type QuizBlock = {
  type: 'QUIZ'
  questions: Array<{
    id: string
    question: string
    options: Array<{ id: string; text: string }>
    correctOptionId: string
  }>
}
type OpenQuestionBlock = { type: 'OPEN_QUESTION'; question: string }
type TableBlock = { type: 'TABLE'; caption?: string; headers: string[]; rows: string[][] }

export type ParsedContentBlock =
  | TextBlock
  | VideoBlock
  | ActivityChecklistBlock
  | ImagesBlock
  | QuizBlock
  | OpenQuestionBlock
  | TableBlock

export interface ParsedLesson {
  title: string
  content: ParsedContentBlock[]
}

/** Extrai placeholders [IMAGEM: caption] do texto e retorna o corpo limpo e as legendas */
function extractImagePlaceholders(body: string): { cleanBody: string; captions: string[] } {
  const captions: string[] = []
  const cleanBody = body.replace(IMAGEM_PLACEHOLDER_REGEX, (_, caption) => {
    captions.push((caption || '').trim())
    return '\n'
  })
  return { cleanBody, captions }
}

/** Converte markdown simples para HTML (listas, negrito, parágrafos) para exibição no TEXT block */
function markdownToHtml(md: string): string {
  let html = md
    // Remover placeholders de imagem/vídeo (já extraídos ou sem uso)
    .replace(IMAGEM_PLACEHOLDER_REGEX, '\n')
    .replace(/\n?>\s*🎬\s*\*\[LINK YOUTUBE:[^\]]*\]\*\s*\n?/g, '\n')
    .replace(/\n?>\s*🔗\s*\*\[LINK:[^\]]*\]\*\s*\n?/g, '\n')
    // Negrito **text** -> <strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Listas - linhas que começam com - 
    .replace(/\n-\s+(.+)/g, '\n<li>$1</li>')
  // Envolver sequências <li> em <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`)
  // Parágrafos: linhas não vazias que não são headers nem listas
  const lines = html.split('\n')
  const result: string[] = []
  let inList = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed.startsWith('<ul>') || trimmed.startsWith('<li>') || trimmed.endsWith('</ul>')) {
      inList = trimmed.includes('</ul>') ? false : true
      result.push(line)
      continue
    }
    if (!trimmed) {
      result.push('')
      continue
    }
    // Headers ## ou ###
    if (trimmed.startsWith('### ')) {
      result.push(`<h3>${trimmed.slice(4)}</h3>`)
      continue
    }
    if (trimmed.startsWith('## ')) {
      result.push(`<h2>${trimmed.slice(3)}</h2>`)
      continue
    }
    if (trimmed.startsWith('# ')) {
      result.push(`<h1>${trimmed.slice(2)}</h1>`)
      continue
    }
    result.push(`<p>${trimmed}</p>`)
  }
  return result.join('\n').replace(/\n/g, '<br/>')
}

/** Extrai o título da aula do início do markdown (## Aula N: ...) */
function extractTitle(md: string): string {
  const match = md.match(/^##\s+Aula\s+\d+:\s*(.+?)(?:\n|$)/m)
  if (match) return match[1].trim()
  const h2 = md.match(/^##\s+(.+?)(?:\n|$)/m)
  return h2 ? h2[1].trim() : 'Aula importada'
}

/** Identifica o tipo do bloco pela linha de cabeçalho */
function getBlockType(headerLine: string): string {
  const normalized = headerLine.toUpperCase().trim()
  if (normalized.includes('TEXTO DE ABERTURA') || normalized.includes('TEXTO COM IMAGEM') || normalized.includes('LINK EXTERNO') || normalized.includes('MENSAGEM DE ENCERRAMENTO')) return 'TEXT'
  if (normalized.includes('TEXTO:') || normalized.startsWith('TEXTO ')) return 'TEXT'
  if (normalized.includes('VÍDEO') || normalized.includes('YOUTUBE')) return 'VIDEO'
  if (normalized.includes('CHECKLIST')) return 'ACTIVITY_CHECKLIST'
  if (normalized.includes('QUIZ')) return 'QUIZ'
  if (normalized.includes('PERGUNTA ABERTA')) return 'OPEN_QUESTION'
  if (normalized.includes('TABELA')) return 'TABLE'
  return 'TEXT'
}

/** Extrai itens do checklist (- [ ] item) */
function parseChecklistItems(body: string): string[] {
  const items: string[] = []
  const regex = /^-\s*\[\s*\]\s*(.+)$/gm
  let m
  while ((m = regex.exec(body)) !== null) {
    items.push(m[1].trim())
  }
  return items.filter(Boolean)
}

/** Extrai título do checklist (primeiro ## no bloco) */
function parseChecklistTitle(body: string): string | undefined {
  const match = body.match(/^##\s+(.+?)(?:\n|$)/m)
  return match ? match[1].trim() : undefined
}

/** Extrai URL do YouTube se houver [LINK YOUTUBE: url] ou link direto */
function extractYoutubeUrl(body: string): string {
  const linkMatch = body.match(/\[LINK YOUTUBE:\s*([^\]]+)\]/i)
  if (linkMatch) return linkMatch[1].trim()
  const urlMatch = body.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s\]\)]+)/i)
  return urlMatch ? urlMatch[1] : ''
}

/** Parseia bloco QUIZ: perguntas com ( ) e (●) e correctOptionId */
function parseQuizBlock(body: string): QuizBlock['questions'] {
  const questions: QuizBlock['questions'] = []
  const questionSections = body.split(/\*\*Pergunta \d+\*\*/).filter((s) => s.trim().length > 0)
  let qIndex = 0
  for (const section of questionSections) {
    const lines = section.trim().split('\n')
    const questionText = lines[0].trim()
    if (!questionText) continue
    const options: Array<{ id: string; text: string }> = []
    let correctOptionId = ''
    let optIndex = 0
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const bulletMatch = line.match(/^-\s*\*?\*?(\(●\)|\(\s\))\s*\*?\*?\s*(.+)$/)
      if (!bulletMatch) continue
      const isCorrect = bulletMatch[1] === '(●)'
      const rawText = bulletMatch[2].trim()
      const text = rawText.replace(/\*\*|\s*✓\s*$/g, '').trim()
      const id = `opt-${qIndex}-${optIndex}`
      options.push({ id, text })
      if (isCorrect) correctOptionId = id
      optIndex++
    }
    if (options.length) {
      if (!correctOptionId) correctOptionId = options[0].id
      questions.push({
        id: `q-${qIndex}`,
        question: questionText,
        options,
        correctOptionId,
      })
      qIndex++
    }
  }
  return questions
}

/** Parseia linhas tipo | c1 | c2 | (markdown) em cabeçalho + linhas; ignora linha |---|---| */
function parseMarkdownPipeTable(body: string): { headers: string[]; rows: string[][] } | null {
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.includes('|'))
  if (lines.length === 0) return null
  const parseRow = (line: string): string[] => {
    const trimmed = line.trim()
    const parts = trimmed.split('|').map((c) => c.trim())
    if (parts[0] === '') parts.shift()
    if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()
    return parts
  }
  const rowsParsed = lines.map(parseRow).filter((cells) => cells.length > 0)
  const isSeparator = (cells: string[]) =>
    cells.length > 0 &&
    cells.every((c) => !c || (/^[\s:-]+$/.test(c) && c.replace(/[\s:-]/g, '').length === 0))
  const dataRows = rowsParsed.filter((cells) => !isSeparator(cells))
  if (dataRows.length === 0) return null
  const headers = dataRows[0]
  const rest = dataRows.slice(1)
  const rows = rest.length > 0 ? rest : [headers.map(() => '')]
  return { headers, rows }
}

/** Extrai a pergunta do bloco PERGUNTA ABERTA (geralmente um parágrafo em negrito ou a primeira pergunta) */
function parseOpenQuestion(body: string): string {
  const boldMatch = body.match(/\*\*([^*]+)\*\*/)
  if (boldMatch) return boldMatch[1].trim()
  const firstLine = body.split('\n').find((l) => l.trim().length > 10)
  return firstLine ? firstLine.trim() : 'Reflita e responda.'
}

/** Converte um bloco bruto (cabeçalho + corpo) em um ou mais ParsedContentBlock */
function parseBlock(headerLine: string, body: string): ParsedContentBlock[] {
  const type = getBlockType(headerLine)
  const bodyTrimmed = body.trim()

  if (type === 'VIDEO') {
    const url = extractYoutubeUrl(body)
    const titleMatch = body.match(/^##\s+(.+?)(?:\n|$)/m)
    return [{
      type: 'VIDEO',
      url: url || 'https://www.youtube.com/watch?v=',
      title: titleMatch ? titleMatch[1].trim() : undefined,
    }]
  }

  if (type === 'ACTIVITY_CHECKLIST') {
    const items = parseChecklistItems(body)
    const title = parseChecklistTitle(body)
    return [{
      type: 'ACTIVITY_CHECKLIST',
      title,
      items: items.length ? items : [bodyTrimmed],
    }]
  }

  if (type === 'QUIZ') {
    const questions = parseQuizBlock(body)
    if (questions.length === 0) {
      return [{ type: 'TEXT', value: markdownToHtml(bodyTrimmed) }]
    }
    return [{ type: 'QUIZ', questions }]
  }

  if (type === 'OPEN_QUESTION') {
    return [{
      type: 'OPEN_QUESTION',
      question: parseOpenQuestion(body),
    }]
  }

  if (type === 'TABLE') {
    const parsed = parseMarkdownPipeTable(body)
    const titleMatch = body.match(/^##\s+(.+?)(?:\n|$)/m)
    if (parsed) {
      return [{
        type: 'TABLE',
        caption: titleMatch ? titleMatch[1].trim() : undefined,
        headers: parsed.headers,
        rows: parsed.rows,
      }]
    }
    return [{ type: 'TEXT', value: markdownToHtml(bodyTrimmed) }]
  }

  // Blocos de texto: extrair [IMAGEM: ...] e gerar bloco IMAGES quando houver
  const { cleanBody, captions } = extractImagePlaceholders(bodyTrimmed)
  const textBlock: TextBlock = {
    type: 'TEXT',
    value: markdownToHtml(cleanBody.trim()),
  }
  if (captions.length === 0) {
    return [textBlock]
  }
  const imagesBlock: ImagesBlock = {
    type: 'IMAGES',
    images: captions.map((caption) => ({ id: randomUUID(), caption: caption || undefined })),
    cardWithBorder: true,
    imageLayout: 'column',
  }
  return [textBlock, imagesBlock]
}

/**
 * Parseia o markdown completo e retorna título e array de blocos para a aula.
 */
export function parseMarkdownLesson(markdown: string): ParsedLesson {
  const title = extractTitle(markdown)
  const content: ParsedContentBlock[] = []

  const parts = markdown.split(BLOCK_HEADER_REGEX)
  // parts[0] = texto antes do primeiro bloco (inclui título da aula, podemos ignorar)
  // parts[1] = tipo do bloco 1, parts[2] = corpo do bloco 1, parts[3] = tipo bloco 2, ...
  for (let i = 1; i < parts.length; i += 2) {
    const headerLine = parts[i].trim()
    const body = parts[i + 1] ? parts[i + 1].trim() : ''
    if (!body) continue
    try {
      content.push(...parseBlock(headerLine, body))
    } catch {
      content.push({ type: 'TEXT', value: markdownToHtml(body) })
    }
  }

  return { title, content }
}
