import { db } from '../config/database.js'
import type { ActivityLog } from '@shared/types'

export interface CreateActivityLogData {
  userId?: string
  action: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class ActivityLogModel {
  static async create(data: CreateActivityLogData): Promise<ActivityLog> {
    const query = `
      INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id as "userId", action, details, ip_address as "ipAddress", 
                user_agent as "userAgent", created_at as "createdAt"
    `
    
    const values = [
      data.userId || null,
      data.action,
      JSON.stringify(data.details || {}),
      data.ipAddress || null,
      data.userAgent || null
    ]
    
    const result = await db.query(query, values)
    return result.rows[0]
  }

  static async findAll(
    page: number = 1, 
    limit: number = 50, 
    userId?: string
  ): Promise<{ logs: ActivityLog[], total: number }> {
    const offset = (page - 1) * limit
    
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs'
    let query = `
      SELECT al.id, al.user_id as "userId", al.action, al.details, 
             al.ip_address as "ipAddress", al.user_agent as "userAgent", 
             al.created_at as "createdAt", u.username, u.name as "userName"
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `
    
    const values: any[] = []
    let paramCount = 1
    
    if (userId) {
      countQuery += ' WHERE user_id = $1'
      query += ' WHERE al.user_id = $1'
      values.push(userId)
      paramCount++
    }
    
    const countResult = await db.query(countQuery, userId ? [userId] : [])
    const total = parseInt(countResult.rows[0].total)
    
    query += ` ORDER BY al.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    values.push(limit, offset)
    
    const result = await db.query(query, values)
    
    return { logs: result.rows, total }
  }

  static async findByUser(userId: string, limit: number = 10): Promise<ActivityLog[]> {
    const query = `
      SELECT id, user_id as "userId", action, details, ip_address as "ipAddress", 
             user_agent as "userAgent", created_at as "createdAt"
      FROM activity_logs 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `
    
    const result = await db.query(query, [userId, limit])
    return result.rows
  }

  static async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const query = `
      DELETE FROM activity_logs 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `
    
    const result = await db.query(query)
    return result.rowCount || 0
  }
}