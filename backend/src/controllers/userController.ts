import { Request, Response } from 'express'
import { UserModel } from '../models/User.js'
import { ActivityLogModel } from '../models/ActivityLog.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import { createLogger } from '../utils/logger.js'
import { hashPassword } from '../utils/password.js'

const logger = createLogger()

export const getUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  
  const { users, total } = await UserModel.findAll(page, limit)
  
  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})

export const getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  
  const user = await UserModel.findById(id)
  if (!user) {
    throw createError('User not found', 404)
  }
  
  res.json({
    success: true,
    data: user
  })
})

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, name, email, password, avatar, isAdmin } = req.body
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  // Validate required fields
  if (!username || !name || !password) {
    throw createError('Username, name, and password are required', 400)
  }
  
  // Check if username already exists
  const existingUser = await UserModel.findByUsername(username)
  if (existingUser) {
    throw createError('Username already exists', 409)
  }
  
  // Create user
  const newUser = await UserModel.create({
    username,
    name,
    email,
    password,
    avatar,
    isAdmin: isAdmin || false
  })
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'user_created',
    details: { 
      createdUserId: newUser.id,
      createdUsername: newUser.username,
      createdUserName: newUser.name
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} created new user ${username}`)
  
  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  })
})

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { name, email, avatar, isActive, isAdmin } = req.body
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  // Check if user exists
  const existingUser = await UserModel.findById(id)
  if (!existingUser) {
    throw createError('User not found', 404)
  }
  
  // Prevent self-deactivation for admins
  if (id === currentUserId && isActive === false) {
    throw createError('Cannot deactivate your own account', 400)
  }
  
  // Update user
  const updatedUser = await UserModel.update(id, {
    name,
    email,
    avatar,
    isActive,
    isAdmin
  })
  
  if (!updatedUser) {
    throw createError('Failed to update user', 500)
  }
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'user_updated',
    details: { 
      updatedUserId: id,
      updatedUsername: updatedUser.username,
      updatedFields: Object.keys({ name, email, avatar, isActive, isAdmin }).filter(key => req.body[key] !== undefined)
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} updated user ${updatedUser.username}`)
  
  res.json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully'
  })
})

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  // Check if user exists
  const existingUser = await UserModel.findById(id)
  if (!existingUser) {
    throw createError('User not found', 404)
  }
  
  // Prevent self-deletion
  if (id === currentUserId) {
    throw createError('Cannot delete your own account', 400)
  }
  
  // Prevent deleting admin users
  if (existingUser.isAdmin) {
    throw createError('Cannot delete admin users', 400)
  }
  
  // Delete user
  const deleted = await UserModel.delete(id)
  if (!deleted) {
    throw createError('Failed to delete user', 500)
  }
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'user_deleted',
    details: { 
      deletedUserId: id,
      deletedUsername: existingUser.username,
      deletedUserName: existingUser.name
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} deleted user ${existingUser.username}`)
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  })
})

export const updateUserPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { newPassword } = req.body
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  if (!newPassword) {
    throw createError('New password is required', 400)
  }
  
  if (newPassword.length < 6) {
    throw createError('Password must be at least 6 characters long', 400)
  }
  
  // Check if user exists
  const existingUser = await UserModel.findById(id)
  if (!existingUser) {
    throw createError('User not found', 404)
  }
  
  // Update password
  const updated = await UserModel.updatePassword(id, newPassword)
  if (!updated) {
    throw createError('Failed to update password', 500)
  }
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'user_password_updated',
    details: { 
      updatedUserId: id,
      updatedUsername: existingUser.username
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} updated password for user ${existingUser.username}`)
  
  res.json({
    success: true,
    message: 'Password updated successfully'
  })
})

export const updateUserPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { permissions } = req.body
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  if (!Array.isArray(permissions)) {
    throw createError('Permissions must be an array', 400)
  }
  
  // Check if user exists
  const existingUser = await UserModel.findById(id)
  if (!existingUser) {
    throw createError('User not found', 404)
  }
  
  // Update permissions
  await UserModel.setUserPermissions(id, permissions, currentUserId)
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'user_permissions_updated',
    details: { 
      updatedUserId: id,
      updatedUsername: existingUser.username,
      newPermissions: permissions
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} updated permissions for user ${existingUser.username}`)
  
  res.json({
    success: true,
    message: 'User permissions updated successfully'
  })
})

export const getUserPermissions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  
  // Check if user exists
  const existingUser = await UserModel.findById(id)
  if (!existingUser) {
    throw createError('User not found', 404)
  }
  
  // Get user permissions
  const permissions = await UserModel.getUserPermissions(id)
  
  res.json({
    success: true,
    data: permissions
  })
})