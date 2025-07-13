import { db } from '../config/database.js'
import type { User } from '@shared/types'
import { hashPassword } from '../utils/password.js'

export interface CreateUserData {
  username: string
  name: string
  password?: string
  email?: string
  avatar?: string
  isAdmin?: boolean
  authProvider?: 'local' | 'google' | 'guest'
  googleId?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  avatar?: string
  isActive?: boolean
  isAdmin?: boolean
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, username, name, avatar, email, is_active as "isActive", 
             is_admin as "isAdmin", auth_provider as "authProvider", google_id as "googleId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE id = $1
    `
    const result = await db.query(query, [id])
    return result.rows[0] || null
  }

  static async findByUsername(username: string): Promise<(User & { password: string }) | null> {
    const query = `
      SELECT id, username, name, password, avatar, email, is_active as "isActive", 
             is_admin as "isAdmin", auth_provider as "authProvider", google_id as "googleId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE username = $1
    `
    const result = await db.query(query, [username])
    return result.rows[0] || null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, username, name, avatar, email, is_active as "isActive", 
             is_admin as "isAdmin", auth_provider as "authProvider", google_id as "googleId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE email = $1
    `
    const result = await db.query(query, [email])
    return result.rows[0] || null
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const query = `
      SELECT id, username, name, avatar, email, is_active as "isActive", 
             is_admin as "isAdmin", auth_provider as "authProvider", google_id as "googleId",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE google_id = $1
    `
    const result = await db.query(query, [googleId])
    return result.rows[0] || null
  }

  static async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit
    
    const countQuery = 'SELECT COUNT(*) as total FROM users'
    const countResult = await db.query(countQuery)
    const total = parseInt(countResult.rows[0].total)
    
    const query = `
      SELECT id, username, name, avatar, email, is_active as "isActive", 
             is_admin as "isAdmin", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `
    const result = await db.query(query, [limit, offset])
    
    return { users: result.rows, total }
  }

  static async create(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (username, name, password, email, avatar, is_admin, auth_provider, google_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, name, avatar, email, is_active as "isActive", 
                is_admin as "isAdmin", auth_provider as "authProvider", google_id as "googleId",
                created_at as "createdAt", updated_at as "updatedAt"
    `
    
    const values = [
      userData.username,
      userData.name,
      userData.password || null,
      userData.email || null,
      userData.avatar || null,
      userData.isAdmin || false,
      userData.authProvider || 'local',
      userData.googleId || null
    ]
    
    const result = await db.query(query, values)
    return result.rows[0]
  }

  static async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const fields = []
    const values = []
    let paramCount = 1
    
    if (userData.name !== undefined) {
      fields.push(`name = $${paramCount}`)
      values.push(userData.name)
      paramCount++
    }
    
    if (userData.email !== undefined) {
      fields.push(`email = $${paramCount}`)
      values.push(userData.email)
      paramCount++
    }
    
    if (userData.avatar !== undefined) {
      fields.push(`avatar = $${paramCount}`)
      values.push(userData.avatar)
      paramCount++
    }
    
    if (userData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount}`)
      values.push(userData.isActive)
      paramCount++
    }
    
    if (userData.isAdmin !== undefined) {
      fields.push(`is_admin = $${paramCount}`)
      values.push(userData.isAdmin)
      paramCount++
    }
    
    if (fields.length === 0) {
      return await this.findById(id)
    }
    
    values.push(id)
    
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, name, avatar, email, is_active as "isActive", 
                is_admin as "isAdmin", created_at as "createdAt", updated_at as "updatedAt"
    `
    
    const result = await db.query(query, values)
    return result.rows[0] || null
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1'
    const result = await db.query(query, [id])
    return result.rowCount > 0
  }

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await hashPassword(newPassword)
    const query = 'UPDATE users SET password = $1 WHERE id = $2'
    const result = await db.query(query, [hashedPassword, id])
    return result.rowCount > 0
  }

  static async getUserPermissions(userId: string): Promise<string[]> {
    const query = `
      SELECT p.id
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = $1
    `
    const result = await db.query(query, [userId])
    return result.rows.map(row => row.id)
  }

  static async setUserPermissions(userId: string, permissionIds: string[], grantedBy: string): Promise<void> {
    const client = await db.connect()
    
    try {
      await client.query('BEGIN')
      
      // Remove existing permissions
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId])
      
      // Add new permissions
      for (const permissionId of permissionIds) {
        await client.query(
          'INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES ($1, $2, $3)',
          [userId, permissionId, grantedBy]
        )
      }
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}