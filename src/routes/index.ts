import { Router, Request, Response } from 'express'
import authRoutes from './auth.routes'
import moduleRoutes from './module.routes'
import lessonRoutes from './lesson.routes'
import userRoutes from './user.routes'
import progressRoutes from './progress.routes'
import imageRoutes from './image.routes'
import platformConfigRoutes from './platform-config.routes'
import gamificationRoutes from './gamification.routes'
import gameRoutes from './game.routes'
import modulesExtraRoutes from '../modules_extra'

const router = Router()

router.use('/auth', authRoutes)
router.use('/modules', moduleRoutes)
router.use('/lessons', lessonRoutes)
router.use('/users', userRoutes)
router.use('/progress', progressRoutes)
router.use('/images', imageRoutes)
router.use('/platform-config', platformConfigRoutes)
router.use('/gamification', gamificationRoutes)
router.use('/games', gameRoutes)
router.use('/extra', modulesExtraRoutes)
router.get('/ping', (_req: Request, res: Response) => {
  res.json('PONG - V.0.1')
})


export default router
