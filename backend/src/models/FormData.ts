import { db } from '../config/database.js'
import type { FormData } from '@shared/types'

export interface CreateFormDataInput {
  userId: string
  projectId: string
  data: Record<string, any>
}

export class FormDataModel {
  static async saveInput(input: CreateFormDataInput): Promise<FormData> {
    const client = await db.connect()
    
    try {
      await client.query('BEGIN')
      
      // Mark all existing entries for this user/project as not latest
      await client.query(
        'UPDATE form_data SET is_latest = false WHERE user_id = $1 AND project_id = $2',
        [input.userId, input.projectId]
      )
      
      // Insert new entry as latest
      const query = `
        INSERT INTO form_data (user_id, project_id, data, is_latest)
        VALUES ($1, $2, $3, true)
        RETURNING id, user_id as "userId", project_id as "projectId", 
                  data, is_latest as "isLatest", created_at as "createdAt"
      `
      
      const result = await client.query(query, [
        input.userId,
        input.projectId,
        JSON.stringify(input.data)
      ])
      
      await client.query('COMMIT')
      
      const row = result.rows[0]
      return {
        ...row,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  static async getLastInput(userId: string, projectId: string): Promise<FormData | null> {
    const query = `
      SELECT id, user_id as "userId", project_id as "projectId", 
             data, is_latest as "isLatest", created_at as "createdAt"
      FROM form_data 
      WHERE user_id = $1 AND project_id = $2 AND is_latest = true
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    const result = await db.query(query, [userId, projectId])
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }
  }

  static async getUserData(userId: string, limit: number = 10): Promise<FormData[]> {
    const query = `
      SELECT fd.id, fd.user_id as "userId", fd.project_id as "projectId", 
             fd.data, fd.is_latest as "isLatest", fd.created_at as "createdAt",
             p.name as "projectName"
      FROM form_data fd
      LEFT JOIN projects p ON fd.project_id = p.id
      WHERE fd.user_id = $1 AND fd.is_latest = true
      ORDER BY fd.created_at DESC
      LIMIT $2
    `
    
    const result = await db.query(query, [userId, limit])
    
    return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }))
  }
}