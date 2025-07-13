import { Request, Response } from 'express'
import { db } from '../config/database.js'
import { ActivityLogModel } from '../models/ActivityLog.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import { createLogger } from '../utils/logger.js'
import type { Project } from '@shared/types'

const logger = createLogger()

export const createProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { 
    id, name, description, component, path, category, 
    version, author, enabled, requiredPermissions, metadata 
  } = req.body
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  // Validate required fields
  if (!id || !name || !description || !component || !path) {
    throw createError('All required fields must be provided', 400)
  }
  
  // Check if project ID already exists
  const existingProject = await db.query('SELECT id FROM projects WHERE id = $1', [id])
  if (existingProject.rows.length > 0) {
    throw createError('Project ID already exists', 409)
  }
  
  // Create project
  const query = `
    INSERT INTO projects (id, name, description, path, component, enabled, version, author, category, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, name, description, path, component, enabled, version, 
              author, category, metadata, created_at as "createdAt", 
              updated_at as "updatedAt"
  `
  
  const values = [
    id, name, description, path, component, 
    enabled !== false, version || '1.0.0', author || 'System',
    category || 'other', JSON.stringify(metadata || {})
  ]
  
  const result = await db.query(query, values)
  const newProject = result.rows[0]
  
  // Parse metadata back to object
  newProject.metadata = typeof newProject.metadata === 'string' 
    ? JSON.parse(newProject.metadata) 
    : newProject.metadata
  
  // Add required permissions if provided
  newProject.requiredPermissions = requiredPermissions || []
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'project_created',
    details: { 
      projectId: newProject.id,
      projectName: newProject.name
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} created project ${id}`)
  
  res.status(201).json({
    success: true,
    data: newProject,
    message: 'Project created successfully'
  })
})

export const updateProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { 
    name, description, component, path, category, 
    version, author, enabled, requiredPermissions, metadata 
  } = req.body
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  // Check if project exists
  const existingProject = await db.query('SELECT * FROM projects WHERE id = $1', [id])
  if (existingProject.rows.length === 0) {
    throw createError('Project not found', 404)
  }
  
  // Build update query dynamically
  const fields = []
  const values = []
  let paramCount = 1
  
  if (name !== undefined) {
    fields.push(`name = $${paramCount}`)
    values.push(name)
    paramCount++
  }
  
  if (description !== undefined) {
    fields.push(`description = $${paramCount}`)
    values.push(description)
    paramCount++
  }
  
  if (component !== undefined) {
    fields.push(`component = $${paramCount}`)
    values.push(component)
    paramCount++
  }
  
  if (path !== undefined) {
    fields.push(`path = $${paramCount}`)
    values.push(path)
    paramCount++
  }
  
  if (category !== undefined) {
    fields.push(`category = $${paramCount}`)
    values.push(category)
    paramCount++
  }
  
  if (version !== undefined) {
    fields.push(`version = $${paramCount}`)
    values.push(version)
    paramCount++
  }
  
  if (author !== undefined) {
    fields.push(`author = $${paramCount}`)
    values.push(author)
    paramCount++
  }
  
  if (enabled !== undefined) {
    fields.push(`enabled = $${paramCount}`)
    values.push(enabled)
    paramCount++
  }
  
  if (metadata !== undefined) {
    fields.push(`metadata = $${paramCount}`)
    values.push(JSON.stringify(metadata))
    paramCount++
  }
  
  if (fields.length === 0) {
    throw createError('No fields to update', 400)
  }
  
  values.push(id)
  
  const query = `
    UPDATE projects 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, name, description, path, component, enabled, version, 
              author, category, metadata, created_at as "createdAt", 
              updated_at as "updatedAt"
  `
  
  const result = await db.query(query, values)
  const updatedProject = result.rows[0]
  
  // Parse metadata back to object
  updatedProject.metadata = typeof updatedProject.metadata === 'string' 
    ? JSON.parse(updatedProject.metadata) 
    : updatedProject.metadata
  
  // Add required permissions
  updatedProject.requiredPermissions = requiredPermissions || []
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'project_updated',
    details: { 
      projectId: id,
      projectName: updatedProject.name,
      updatedFields: Object.keys({ name, description, component, path, category, version, author, enabled, metadata })
        .filter(key => req.body[key] !== undefined)
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} updated project ${id}`)
  
  res.json({
    success: true,
    data: updatedProject,
    message: 'Project updated successfully'
  })
})

export const deleteProject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const currentUserId = req.user?.userId
  
  if (!currentUserId) {
    throw createError('Authentication required', 401)
  }
  
  // Check if project exists
  const existingProject = await db.query('SELECT * FROM projects WHERE id = $1', [id])
  if (existingProject.rows.length === 0) {
    throw createError('Project not found', 404)
  }
  
  const project = existingProject.rows[0]
  
  // Delete related form data first (cascade delete)
  await db.query('DELETE FROM form_data WHERE project_id = $1', [id])
  
  // Delete project
  const result = await db.query('DELETE FROM projects WHERE id = $1', [id])
  
  if (result.rowCount === 0) {
    throw createError('Failed to delete project', 500)
  }
  
  // Log activity
  await ActivityLogModel.create({
    userId: currentUserId,
    action: 'project_deleted',
    details: { 
      projectId: id,
      projectName: project.name
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })
  
  logger.info(`User ${req.user?.username} deleted project ${id}`)
  
  res.json({
    success: true,
    message: 'Project deleted successfully'
  })
})

export const getAllProjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = `
    SELECT id, name, description, path, component, enabled, version, 
           author, category, metadata, created_at as "createdAt", 
           updated_at as "updatedAt"
    FROM projects 
    ORDER BY created_at DESC
  `
  
  const result = await db.query(query)
  
  const projects = result.rows.map(row => ({
    ...row,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
    requiredPermissions: getProjectPermissions(row.id) // Simple mapping for now
  }))
  
  res.json({
    success: true,
    data: projects
  })
})

export const getProjectById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  
  const query = `
    SELECT id, name, description, path, component, enabled, version, 
           author, category, metadata, created_at as "createdAt", 
           updated_at as "updatedAt"
    FROM projects 
    WHERE id = $1
  `
  
  const result = await db.query(query, [id])
  
  if (result.rows.length === 0) {
    throw createError('Project not found', 404)
  }
  
  const project = result.rows[0]
  project.metadata = typeof project.metadata === 'string' 
    ? JSON.parse(project.metadata) 
    : project.metadata
  project.requiredPermissions = getProjectPermissions(project.id)
  
  res.json({
    success: true,
    data: project
  })
})

// Helper function to get project permissions (simplified)
function getProjectPermissions(projectId: string): string[] {
  switch (projectId) {
    case 'bmi-calculator':
      return ['bmi_access']
    case 'tdee-calculator':
      return ['tdee_access']
    default:
      return []
  }
}