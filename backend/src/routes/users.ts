import { Router } from 'express'
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser,
  updateUserPassword,
  updateUserPermissions,
  getUserPermissions
} from '../controllers/userController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = Router()

// All user management routes require authentication and admin privileges
router.use(authenticateToken)
router.use(requireAdmin)

// User CRUD operations
router.get('/', getUsers)
router.get('/:id', getUser)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

// Password management
router.put('/:id/password', updateUserPassword)

// Permission management
router.get('/:id/permissions', getUserPermissions)
router.put('/:id/permissions', updateUserPermissions)

export default router