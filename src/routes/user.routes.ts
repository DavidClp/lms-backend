import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

router.get('/', authenticate, requireRole('ADMIN'), userController.list)
router.get('/:id', authenticate, userController.getById)
router.post('/', authenticate, requireRole('ADMIN'), userController.create)
router.put('/:id', authenticate, userController.update)
router.delete('/:id', authenticate, requireRole('ADMIN'), userController.delete)

export default router
