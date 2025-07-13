import { Request, Response } from 'express'
import { ProjectModel } from '../models/Project.js'
import { FormDataModel } from '../models/FormData.js'
import { UserModel } from '../models/User.js'
import { ActivityLogModel } from '../models/ActivityLog.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger()

export const getProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projects = await ProjectModel.findAll()
  
  res.json({
    success: true,
    data: projects
  })
})

export const getProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  
  const project = await ProjectModel.findById(id)
  if (!project) {
    throw createError('Project not found', 404)
  }
  
  res.json({
    success: true,
    data: project
  })
})

export const getLastInput = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params
  const userId = req.user?.userId
  
  if (!userId) {
    throw createError('Authentication required', 401)
  }
  
  // Check if project exists
  const project = await ProjectModel.findById(projectId)
  if (!project) {
    throw createError('Project not found', 404)
  }
  
  // Check if user has permission to access this project
  const userPermissions = await UserModel.getUserPermissions(userId)
  const requiredPermissions = await ProjectModel.getRequiredPermissions(projectId)
  
  const hasAccess = requiredPermissions.every(permission => 
    userPermissions.includes(permission) || userPermissions.includes('admin')
  )
  
  if (!hasAccess) {
    throw createError('Access denied to this project', 403)
  }
  
  const lastInput = await FormDataModel.getLastInput(userId, projectId)
  
  res.json({
    success: true,
    data: lastInput
  })
})

export const saveInput = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params
  const { data } = req.body
  const userId = req.user?.userId
  
  if (!userId) {
    throw createError('Authentication required', 401)
  }
  
  if (!data || typeof data !== 'object') {
    throw createError('Invalid input data', 400)
  }
  
  // Check if project exists
  const project = await ProjectModel.findById(projectId)
  if (!project) {
    throw createError('Project not found', 404)
  }
  
  // Check if user has permission to access this project
  const userPermissions = await UserModel.getUserPermissions(userId)
  const requiredPermissions = await ProjectModel.getRequiredPermissions(projectId)
  
  const hasAccess = requiredPermissions.every(permission => 
    userPermissions.includes(permission) || userPermissions.includes('admin')
  )
  
  if (!hasAccess) {
    throw createError('Access denied to this project', 403)
  }
  
  // Save the input data
  const savedData = await FormDataModel.saveInput({
    userId,
    projectId,
    data
  })
  
  // Log the activity
  await ActivityLogModel.create({
    userId,
    action: 'form_input_saved',
    details: { 
      projectId, 
      projectName: project.name,
      dataKeys: Object.keys(data)
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} saved input for project ${projectId}`)
  
  res.json({
    success: true,
    data: savedData,
    message: 'Input saved successfully'
  })
})