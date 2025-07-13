import dotenv from 'dotenv'
import { initDatabase, db } from '../config/database.js'
import { UserModel } from '../models/User.js'
import { createLogger } from '../utils/logger.js'

dotenv.config()

const logger = createLogger()

async function seedDatabase() {
  try {
    await initDatabase()
    logger.info('Database initialized')
    
    // Create permissions
    await seedPermissions()
    
    // Create projects
    await seedProjects()
    
    // Create admin user
    await seedAdminUser()
    
    // Create demo users
    await seedDemoUsers()
    
    logger.info('Database seeding completed successfully')
    process.exit(0)
  } catch (error) {
    logger.error('Database seeding failed:', error)
    process.exit(1)
  }
}

async function seedPermissions() {
  const permissions = [
    { id: 'bmi_access', name: 'BMI計算器訪問權限', description: '允許用戶使用BMI計算器' },
    { id: 'tdee_access', name: 'TDEE計算器訪問權限', description: '允許用戶使用TDEE計算器' },
    { id: 'admin', name: '管理員權限', description: '完整的系統管理權限' }
  ]
  
  for (const permission of permissions) {
    await db.query(
      `INSERT INTO permissions (id, name, description) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (id) DO UPDATE SET name = $2, description = $3`,
      [permission.id, permission.name, permission.description]
    )
  }
  
  logger.info('Permissions seeded')
}

async function seedProjects() {
  const projects = [
    {
      id: 'bmi-calculator',
      name: 'BMI計算器',
      description: '身體質量指數計算工具',
      path: '/projects/bmi-calculator',
      component: 'BMICalculator',
      enabled: true,
      isPublic: true, // 設為公開使用
      version: '1.0.0',
      author: 'Dynamic Form System',
      category: 'health',
      metadata: JSON.stringify({
        saveLastInput: true,
        saveHistory: false,
        maxInputFields: 10
      })
    },
    {
      id: 'tdee-calculator',
      name: 'TDEE計算器',
      description: '每日總能量消耗計算工具',
      path: '/projects/tdee-calculator',
      component: 'TDEECalculator',
      enabled: true,
      isPublic: true, // 設為公開使用
      version: '1.0.0',
      author: 'Dynamic Form System',
      category: 'health',
      metadata: JSON.stringify({
        saveLastInput: true,
        saveHistory: false,
        maxInputFields: 15
      })
    }
  ]
  
  for (const project of projects) {
    await db.query(
      `INSERT INTO projects (id, name, description, path, component, enabled, is_public, version, author, category, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET 
         name = $2, description = $3, path = $4, component = $5, 
         enabled = $6, is_public = $7, version = $8, author = $9, category = $10, metadata = $11`,
      [
        project.id, project.name, project.description, project.path,
        project.component, project.enabled, project.isPublic, project.version, 
        project.author, project.category, project.metadata
      ]
    )
  }
  
  logger.info('Projects seeded')
}

async function seedAdminUser() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  // Check if admin user already exists
  const existingAdmin = await UserModel.findByUsername(adminUsername)
  
  if (!existingAdmin) {
    const adminUser = await UserModel.create({
      username: adminUsername,
      name: '系統管理員',
      password: adminPassword,
      email: 'admin@dynamicform.com',
      isAdmin: true
    })
    
    // Grant all permissions to admin
    await UserModel.setUserPermissions(
      adminUser.id,
      ['bmi_access', 'tdee_access', 'admin'],
      adminUser.id
    )
    
    logger.info(`Admin user created: ${adminUsername}`)
  } else {
    logger.info('Admin user already exists')
  }
}

async function seedDemoUsers() {
  const demoUsers = [
    {
      username: 'user1',
      name: '測試用戶一',
      password: 'password123',
      email: 'user1@example.com',
      permissions: ['bmi_access', 'tdee_access']
    },
    {
      username: 'user2',
      name: '測試用戶二',
      password: 'password123',
      email: 'user2@example.com',
      permissions: ['bmi_access', 'tdee_access']
    }
  ]
  
  for (const userData of demoUsers) {
    const existingUser = await UserModel.findByUsername(userData.username)
    
    if (!existingUser) {
      const user = await UserModel.create({
        username: userData.username,
        name: userData.name,
        password: userData.password,
        email: userData.email,
        isAdmin: false
      })
      
      // Grant permissions
      const admin = await UserModel.findByUsername(process.env.ADMIN_USERNAME || 'admin')
      if (admin) {
        await UserModel.setUserPermissions(user.id, userData.permissions, admin.id)
      }
      
      logger.info(`Demo user created: ${userData.username}`)
    } else {
      // Update permissions for existing users
      const admin = await UserModel.findByUsername(process.env.ADMIN_USERNAME || 'admin')
      if (admin) {
        await UserModel.setUserPermissions(existingUser.id, userData.permissions, admin.id)
        logger.info(`Demo user permissions updated: ${userData.username}`)
      }
    }
  }
}

seedDatabase()