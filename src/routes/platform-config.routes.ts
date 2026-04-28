import { Router } from 'express'
import { platformConfigController } from '../controllers/platform-config.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

router.get('/', authenticate, requireRole('ADMIN'), platformConfigController.get)
router.put('/', authenticate, requireRole('ADMIN'), platformConfigController.update)

export default router
