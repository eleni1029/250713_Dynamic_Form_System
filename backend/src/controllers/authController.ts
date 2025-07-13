import { Request, Response } from 'express'
import { UserModel } from '../models/User.js'
import { comparePassword, hashPassword } from '../utils/password.js'
import { generateToken } from '../utils/jwt.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import { createLogger } from '../utils/logger.js'
import { ActivityLogModel } from '../models/ActivityLog.js'
import type { LoginCredentials, AuthResponse, RegisterData, GoogleAuthData, GuestLoginData } from '@shared/types'
import { v4 as uuidv4 } from 'uuid'
import { OAuth2Client } from 'google-auth-library'

const logger = createLogger()

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
)

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password }: LoginCredentials = req.body
  
  if (!username || !password) {
    throw createError('Username and password are required', 400)
  }
  
  // Find user by username
  const user = await UserModel.findByUsername(username)
  if (!user) {
    throw createError('Invalid credentials', 401)
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw createError('Account is disabled', 401)
  }
  
  // Verify password (skip for non-local auth providers)
  if (user.authProvider === 'local' && user.password) {
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401)
    }
  } else if (user.authProvider !== 'local') {
    throw createError('Please use the appropriate login method for this account', 401)
  } else {
    throw createError('Invalid credentials', 401)
  }
  
  // Get user permissions
  const permissions = await UserModel.getUserPermissions(user.id)
  
  // Add admin permission if user is admin
  if (user.isAdmin) {
    permissions.push('admin')
  }
  
  // Generate JWT token
  const token = generateToken(user)
  
  // Log login activity
  await ActivityLogModel.create({
    userId: user.id,
    action: 'login',
    details: { username },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user
  
  const authResponse: AuthResponse = {
    token,
    user: userWithoutPassword,
    permissions
  }
  
  logger.info(`User ${username} logged in successfully`)
  
  res.json({
    success: true,
    data: authResponse,
    message: 'Login successful'
  })
})

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId
  
  if (userId) {
    // Log logout activity
    await ActivityLogModel.create({
      userId,
      action: 'logout',
      details: {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    logger.info(`User ${req.user?.username} logged out`)
  }
  
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

export const verify = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId
  
  if (!userId) {
    throw createError('Authentication required', 401)
  }
  
  // Get current user data
  const user = await UserModel.findById(userId)
  if (!user) {
    throw createError('User not found', 404)
  }
  
  if (!user.isActive) {
    throw createError('Account is disabled', 401)
  }
  
  // Get user permissions
  const permissions = await UserModel.getUserPermissions(user.id)
  
  // Add admin permission if user is admin
  if (user.isAdmin) {
    permissions.push('admin')
  }
  
  const authResponse: AuthResponse = {
    token: req.headers.authorization?.split(' ')[1] || '',
    user,
    permissions
  }
  
  res.json({
    success: true,
    data: authResponse,
    message: 'Token is valid'
  })
})

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId
  
  if (!userId) {
    throw createError('Authentication required', 401)
  }
  
  const user = await UserModel.findById(userId)
  if (!user) {
    throw createError('User not found', 404)
  }
  
  res.json({
    success: true,
    data: user
  })
})

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId
  
  if (!userId) {
    throw createError('Authentication required', 401)
  }
  
  const { name, email, avatar } = req.body
  
  const updatedUser = await UserModel.update(userId, {
    name,
    email,
    avatar
  })
  
  if (!updatedUser) {
    throw createError('Failed to update profile', 500)
  }
  
  // Log profile update activity
  await ActivityLogModel.create({
    userId,
    action: 'profile_update',
    details: { fields: Object.keys({ name, email, avatar }).filter(key => req.body[key] !== undefined) },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  })
})

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, name, password, email }: RegisterData = req.body
  
  if (!username || !name || !password) {
    throw createError('Username, name and password are required', 400)
  }
  
  // Check if username already exists
  const existingUser = await UserModel.findByUsername(username)
  if (existingUser) {
    throw createError('Username already exists', 409)
  }
  
  // Check if email already exists (if provided)
  if (email) {
    const existingEmail = await UserModel.findByEmail(email)
    if (existingEmail) {
      throw createError('Email already exists', 409)
    }
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password)
  
  // Create user
  const user = await UserModel.create({
    username,
    name,
    password: hashedPassword,
    email,
    authProvider: 'local'
  })
  
  // Get user permissions (default empty for new users)
  const permissions: string[] = []
  
  // Generate JWT token
  const token = generateToken(user)
  
  // Log registration activity
  await ActivityLogModel.create({
    userId: user.id,
    action: 'register',
    details: { username, authProvider: 'local' },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  const authResponse: AuthResponse = {
    token,
    user,
    permissions
  }
  
  logger.info(`User ${username} registered successfully`)
  
  res.status(201).json({
    success: true,
    data: authResponse,
    message: 'Registration successful'
  })
})

export const googleAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body
  
  if (!idToken) {
    throw createError('Google ID token is required', 400)
  }
  
  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()
    
    if (!payload || !payload.sub || !payload.email || !payload.name) {
      throw createError('Invalid Google token payload', 400)
    }
    
    const googleId = payload.sub
    const email = payload.email
    const name = payload.name
    const avatar = payload.picture
    
    // Check if user already exists with this Google ID
    let user = await UserModel.findByGoogleId(googleId)
    
    if (!user) {
      // Check if user exists with this email
      const existingUser = await UserModel.findByEmail(email)
      if (existingUser) {
        // Link the Google account to existing user if they have the same email
        user = await UserModel.update(existingUser.id, {
          googleId,
          authProvider: 'google'
        })
      } else {
        // Create new user
        const username = `google_${googleId.slice(0, 8)}`
        user = await UserModel.create({
          username,
          name,
          email,
          avatar,
          authProvider: 'google',
          googleId
        })
        
        // Log registration activity
        await ActivityLogModel.create({
          userId: user.id,
          action: 'register',
          details: { authProvider: 'google', email },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })
        
        logger.info(`User ${name} registered via Google`)
      }
    } else {
      // Update user info if needed
      if (user.name !== name || user.avatar !== avatar) {
        user = await UserModel.update(user.id, { name, avatar })
      }
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw createError('Account is disabled', 401)
    }
    
    // Get user permissions
    const permissions = await UserModel.getUserPermissions(user.id)
    
    // Add admin permission if user is admin
    if (user.isAdmin) {
      permissions.push('admin')
    }
    
    // Generate JWT token
    const token = generateToken(user)
    
    // Log login activity
    await ActivityLogModel.create({
      userId: user.id,
      action: 'login',
      details: { authProvider: 'google' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    const authResponse: AuthResponse = {
      token,
      user,
      permissions
    }
    
    logger.info(`User ${name} logged in via Google`)
    
    res.json({
      success: true,
      data: authResponse,
      message: 'Google authentication successful'
    })
  } catch (error) {
    logger.error('Google authentication error:', error)
    throw createError('Google authentication failed', 401)
  }
})

export const guestLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name }: GuestLoginData = req.body
  
  if (!name || name.trim().length === 0) {
    throw createError('Guest name is required', 400)
  }
  
  // Create a temporary guest user
  const guestId = uuidv4()
  const username = `guest_${guestId.slice(0, 8)}`
  
  const user = await UserModel.create({
    username,
    name: name.trim(),
    authProvider: 'guest'
  })
  
  // Guest users get no permissions by default
  const permissions: string[] = []
  
  // Generate JWT token
  const token = generateToken(user)
  
  // Log guest login activity
  await ActivityLogModel.create({
    userId: user.id,
    action: 'guest_login',
    details: { name: name.trim() },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  const authResponse: AuthResponse = {
    token,
    user,
    permissions
  }
  
  logger.info(`Guest user ${name} logged in`)
  
  res.json({
    success: true,
    data: authResponse,
    message: 'Guest login successful'
  })
})