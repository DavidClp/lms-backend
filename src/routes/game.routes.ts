import { Router } from 'express'
import { gameController } from '../controllers/game.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

router.get('/', authenticate, gameController.list)
router.get('/:id', authenticate, gameController.getById)
router.post('/', authenticate, requireRole('ADMIN'), gameController.create)
router.put('/:id', authenticate, requireRole('ADMIN'), gameController.update)
router.post('/:id/regenerate', authenticate, requireRole('ADMIN'), gameController.regenerate)
router.delete('/:id', authenticate, requireRole('ADMIN'), gameController.delete)
router.post('/:id/complete', authenticate, gameController.complete)

export default router
