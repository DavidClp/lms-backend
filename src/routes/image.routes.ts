import { Router } from 'express'
import { imageController, upload } from '../controllers/image.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { requireRole } from '../middlewares/role.middleware'

const router = Router()

// Upload one or more images (admin only)
router.post('/', authenticate, requireRole('ADMIN'), upload.array('images', 20), imageController.upload)

// Serve image binary (public — browsers load images without auth headers)
router.get('/:id', imageController.getById)

export default router
