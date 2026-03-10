import { Router } from 'express'
import { lessonController } from '../controllers/lesson.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

router.get('/', authenticate, lessonController.list)
router.get('/:id', authenticate, lessonController.getById)
router.post('/', authenticate, requireRole('ADMIN'), lessonController.create)
router.put('/:id', authenticate, requireRole('ADMIN'), lessonController.update)
router.delete('/:id', authenticate, requireRole('ADMIN'), lessonController.delete)

export default router
