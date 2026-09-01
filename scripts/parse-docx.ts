/**
 * CLI para validar o parser de .docx
 * Uso: npm run parse:docx -- "caminho/arquivo.docx"
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseDocxLesson } from '../src/services/docx-lesson-parser'

const filePath = process.argv[2]
if (!filePath) {
  console.error('Uso: npm run parse:docx -- <caminho.docx>')
  process.exit(1)
}

const abs = resolve(filePath)
const buffer = readFileSync(abs)
const result = parseDocxLesson(buffer)

const counts: Record<string, number> = {}
for (const block of result.content) {
  counts[block.type] = (counts[block.type] ?? 0) + 1
}

console.log('Título:', result.title)
console.log('Total de blocos:', result.content.length)
console.log('Por tipo:', counts)

const quiz = result.content.find((b) => b.type === 'QUIZ')
if (quiz && quiz.type === 'QUIZ') {
  console.log('Questões no quiz:', quiz.questions.length)
  console.log('Primeira questão:', quiz.questions[0]?.question?.slice(0, 60))
  console.log('Explicação Q1:', quiz.questions[0]?.explanation?.slice(0, 80))
}

const images = result.content.filter((b) => b.type === 'IMAGES')
console.log('Placeholders de imagem:', images.length)
