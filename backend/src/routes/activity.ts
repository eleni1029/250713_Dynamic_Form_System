import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

// Placeholder for activity log routes - will be implemented in the next phase
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    success: false,
    message: 'Activity log routes not implemented yet'
  })
}))

export default router