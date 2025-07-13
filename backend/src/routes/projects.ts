import { Router } from 'express'
import { getProjects, getProject, getLastInput, saveInput } from '../controllers/projectController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// Public routes
router.get('/', getProjects)
router.get('/:id', getProject)

// Protected routes
router.use(authenticateToken)
router.get('/:projectId/last-input', getLastInput)
router.post('/:projectId/input', saveInput)

export default router