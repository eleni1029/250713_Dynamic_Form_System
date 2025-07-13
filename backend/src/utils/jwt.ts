import jwt from 'jsonwebtoken'
import type { User } from '@shared/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h'

export interface JwtPayload {
  userId: string
  username: string
  isAdmin: boolean
}

export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    isAdmin: user.isAdmin || false
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch (error) {
    return null
  }
}