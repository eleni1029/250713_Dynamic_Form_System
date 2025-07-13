import { db } from '../config/database.js'
import type { Project } from '@shared/types'

export class ProjectModel {
  static async findAll(): Promise<Project[]> {
    const query = `
      SELECT id, name, description, path, component, enabled, is_public as "isPublic", 
             version, author, category, metadata, created_at as "createdAt", 
             updated_at as "updatedAt"
      FROM projects 
      WHERE enabled = true
      ORDER BY name
    `
    const result = await db.query(query)
    
    return result.rows.map(row => ({
      ...row,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      requiredPermissions: this.getRequiredPermissions(row.id)
    }))
  }
  
  private static getRequiredPermissions(projectId: string): string[] {
    switch (projectId) {
      case 'bmi-calculator':
        return ['bmi_access']
      case 'tdee-calculator':
        return ['tdee_access']
      default:
        return []
    }
  }

  static async findById(id: string): Promise<Project | null> {
    const query = `
      SELECT id, name, description, path, component, enabled, is_public as "isPublic", 
             version, author, category, metadata, created_at as "createdAt", 
             updated_at as "updatedAt"
      FROM projects 
      WHERE id = $1
    `
    const result = await db.query(query, [id])
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      ...row,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      requiredPermissions: this.getRequiredPermissions(row.id)
    }
  }

  static async getRequiredPermissions(projectId: string): Promise<string[]> {
    // Return permissions based on project ID for now
    switch (projectId) {
      case 'bmi-calculator':
        return ['bmi_access']
      case 'tdee-calculator':
        return ['tdee_access']
      default:
        return []
    }
  }
}