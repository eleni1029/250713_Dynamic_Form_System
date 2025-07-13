import { Router } from 'express'
import { login, logout, verify, getProfile, updateProfile, register, googleAuth, guestLogin } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// Public routes
router.post('/login', login)
router.post('/register', register)
router.post('/google', googleAuth)
router.post('/guest', guestLogin)

// Protected routes
router.use(authenticateToken)
router.post('/logout', logout)
router.get('/verify', verify)
router.get('/profile', getProfile)
router.put('/profile', updateProfile)

export default router