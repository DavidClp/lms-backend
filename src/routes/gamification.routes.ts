import { Router } from 'express'
import { gamificationController } from '../controllers/gamification.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/me', authenticate, gamificationController.getMe)
router.put('/avatar', authenticate, gamificationController.updateAvatar)

export default router
