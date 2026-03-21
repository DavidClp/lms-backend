import { Router } from 'express'
import { progressController } from '../controllers/progress.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

router.get(
  '/user/:userId',
  authenticate,
  requireRole('ADMIN'),
  progressController.getUserProgressForAdmin,
)
router.get('/user', authenticate, progressController.getUserProgress)
router.post('/', authenticate, progressController.toggleProgress)
router.post('/quiz', authenticate, progressController.saveQuizResults)
router.post('/open-question', authenticate, progressController.saveOpenQuestionAnswer)

export default router
