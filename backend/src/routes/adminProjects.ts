import { Router } from 'express'
import { 
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getProjectById
} from '../controllers/adminProjectController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = Router()

// All admin project routes require authentication and admin privileges
router.use(authenticateToken)
router.use(requireAdmin)

// Project CRUD operations
router.get('/', getAllProjects)
router.get('/:id', getProjectById)
router.post('/', createProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)

export default router