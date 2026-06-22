import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../database.js'
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

function generateToken(user: { id: number; phone: string; role: number }) {
  return jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, name, address } = req.body
    if (!phone || !password || !name) {
      res.status(400).json({ success: false, error: '手机号、密码和姓名为必填项' })
      return
    }
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
    if (existing) {
      res.status(400).json({ success: false, error: '该手机号已注册' })
      return
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const result = db.prepare('INSERT INTO users (phone, password, name, address) VALUES (?, ?, ?, ?)').run(
      phone, hashedPassword, name, address || ''
    )
    const user = db.prepare('SELECT id, phone, name, role FROM users WHERE id = ?').get(result.lastInsertRowid) as any
    const token = generateToken(user)
    res.json({ success: true, data: { token, user } })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      res.status(400).json({ success: false, error: '手机号和密码为必填项' })
      return
    }
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any
    if (!user) {
      res.status(400).json({ success: false, error: '用户不存在' })
      return
    }
    if (user.status === 0) {
      res.status(403).json({ success: false, error: '账号已被禁用' })
      return
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(400).json({ success: false, error: '密码错误' })
      return
    }
    const token = generateToken(user)
    const { password: _, ...userWithoutPassword } = user
    res.json({ success: true, data: { token, user: userWithoutPassword } })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/profile', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, phone, name, avatar, address, role, points, status, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.put('/profile', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, avatar, address } = req.body
    const updates: string[] = []
    const values: any[] = []
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar) }
    if (address !== undefined) { updates.push('address = ?'); values.push(address) }
    if (updates.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }
    values.push(req.user!.id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const user = db.prepare('SELECT id, phone, name, avatar, address, role, points, status, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新用户信息失败' })
  }
})

export default router
