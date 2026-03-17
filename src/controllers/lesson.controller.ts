import { Request, Response, NextFunction } from 'express'
import { ListLessonsUseCase } from '../use-cases/lessons/list-lessons.use-case'
import { ListLessonsByModuleUseCase } from '../use-cases/lessons/list-lessons-by-module.use-case'
import { GetLessonUseCase } from '../use-cases/lessons/get-lesson.use-case'
import { CreateLessonUseCase } from '../use-cases/lessons/create-lesson.use-case'
import { UpdateLessonUseCase } from '../use-cases/lessons/update-lesson.use-case'
import { DeleteLessonUseCase } from '../use-cases/lessons/delete-lesson.use-case'
import { GetLessonQuizResultsUseCase } from '../use-cases/progress/get-lesson-quiz-results.use-case'
import { lessonRepository, moduleRepository, progressRepository, studentModuleAccessRepository, imageRepository } from '../repositories'
import { parseMarkdownLesson } from '../services/markdown-lesson-parser'

export const lessonController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lessons = await new ListLessonsUseCase(lessonRepository).execute()
      res.json(lessons)
    } catch (e) {
      next(e)
    }
  },

  async listByModule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auth = req.user ? { userId: req.user.id, role: req.user.role } : undefined
      const lessons = await new ListLessonsByModuleUseCase(
        lessonRepository,
        moduleRepository,
        studentModuleAccessRepository,
      ).execute(req.params.id, auth)
      res.json(lessons)
    } catch (e) {
      next(e)
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const auth = req.user ? { userId: req.user.id, role: req.user.role } : undefined
      const lesson = await new GetLessonUseCase(lessonRepository, studentModuleAccessRepository).execute(req.params.id, auth)
      res.json(lesson)
    } catch (e) {
      next(e)
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lesson = await new CreateLessonUseCase(lessonRepository, moduleRepository).execute(req.body)
      res.status(201).json(lesson)
    } catch (e) {
      next(e)
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lesson = await new UpdateLessonUseCase(lessonRepository, imageRepository).execute(req.params.id, req.body)
      res.json(lesson)
    } catch (e) {
      next(e)
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await new DeleteLessonUseCase(lessonRepository).execute(req.params.id)
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  },

  async getQuizResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await new GetLessonQuizResultsUseCase(
        progressRepository,
        lessonRepository
      ).execute(req.params.id)
      res.json(result)
    } catch (e) {
      next(e)
    }
  },

  async importFromMarkdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { moduleId, order, markdown, title: customTitle } = req.body as {
        moduleId: string
        order: number
        markdown: string
        title?: string
      }
      if (!moduleId || typeof markdown !== 'string' || markdown.trim() === '') {
        res.status(400).json({ message: 'moduleId e markdown são obrigatórios' })
        return
      }
      const parsed = parseMarkdownLesson(markdown)
      const title = customTitle?.trim() || parsed.title
      const orderNum = typeof order === 'number' ? order : parseInt(String(order), 10) || 1
      const lesson = await new CreateLessonUseCase(lessonRepository, moduleRepository).execute({
        moduleId,
        title,
        order: orderNum,
        content: parsed.content,
      })
      res.status(201).json(lesson)
    } catch (e) {
      next(e)
    }
  },
}
