import { Router } from 'express'
import { moduleController } from '../controllers/module.controller'
import { lessonController } from '../controllers/lesson.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

router.get('/', authenticate, moduleController.list)
router.get('/:id', authenticate, moduleController.getById)
router.get('/:id/lessons', authenticate, lessonController.listByModule)
router.post('/', authenticate, requireRole('ADMIN'), moduleController.create)
router.put('/:id', authenticate, requireRole('ADMIN'), moduleController.update)
router.delete('/:id', authenticate, requireRole('ADMIN'), moduleController.delete)

export default router
