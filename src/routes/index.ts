import { Router } from 'express'
import authRoutes from './auth.routes'
import moduleRoutes from './module.routes'
import lessonRoutes from './lesson.routes'
import userRoutes from './user.routes'
import progressRoutes from './progress.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/modules', moduleRoutes)
router.use('/lessons', lessonRoutes)
router.use('/users', userRoutes)
router.use('/progress', progressRoutes)

export default router
