import { Router } from 'express'
import { progressController } from '../controllers/progress.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/user', authenticate, progressController.getUserProgress)
router.post('/', authenticate, progressController.toggleProgress)

export default router
