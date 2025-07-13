import { Request, Response, NextFunction } from 'express'
import { verifyToken, type JwtPayload } from '../utils/jwt.js'
import { createError } from './errorHandler.js'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN
  
  if (!token) {
    throw createError('Access token required', 401)
  }
  
  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    throw createError('Invalid or expired token', 401)
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw createError('Authentication required', 401)
  }
  
  if (!req.user.isAdmin) {
    throw createError('Admin access required', 403)
  }
  
  next()
}

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  
  if (token) {
    try {
      const decoded = verifyToken(token)
      req.user = decoded
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }
  
  next()
}