import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category_id, keyword, status } = req.query
    let sql = `SELECT t.*, u.name as user_name, c.name as category_name
      FROM tools t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1`
    const params: any[] = []
    if (category_id) { sql += ' AND t.category_id = ?'; params.push(category_id) }
    if (keyword) { sql += ' AND t.name LIKE ?'; params.push(`%${keyword}%`) }
    if (status !== undefined) { sql += ' AND t.status = ?'; params.push(status) }
    sql += ' ORDER BY t.created_at DESC'
    const tools = db.prepare(sql).all(...params) as any[]
    tools.forEach(t => { try { t.images = JSON.parse(t.images) } catch { t.images = [] } })
    res.json({ success: true, data: tools })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取工具列表失败' })
  }
})

router.get('/hot', (req: Request, res: Response): void => {
  try {
    const tools = db.prepare(`SELECT t.*, u.name as user_name, c.name as category_name
      FROM tools t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.status IN (1, 2)
      ORDER BY t.borrow_count DESC
      LIMIT 10`).all() as any[]
    tools.forEach(t => { try { t.images = JSON.parse(t.images) } catch { t.images = [] } })
    res.json({ success: true, data: tools })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取热门工具失败' })
  }
})

router.get('/rankings', (req: Request, res: Response): void => {
  try {
    const { limit } = req.query
    const rankings = db.prepare(`SELECT id, name, avatar, points FROM users WHERE status = 1 ORDER BY points DESC LIMIT ?`).all(Number(limit) || 20) as any[]
    res.json({ success: true, data: rankings })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取排行榜失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const tool = db.prepare(`SELECT t.*, u.name as user_name, u.avatar as user_avatar, c.name as category_name
      FROM tools t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?`).get(req.params.id) as any
    if (!tool) {
      res.status(404).json({ success: false, error: '工具不存在' })
      return
    }
    try { tool.images = JSON.parse(tool.images) } catch { tool.images = [] }
    res.json({ success: true, data: tool })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取工具详情失败' })
  }
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, category_id, description, deposit, images } = req.body
    if (!name || !category_id) {
      res.status(400).json({ success: false, error: '工具名称和分类为必填项' })
      return
    }
    const result = db.prepare('INSERT INTO tools (user_id, name, category_id, description, deposit, images) VALUES (?, ?, ?, ?, ?, ?)').run(
      req.user!.id, name, category_id, description || '', deposit || 0, JSON.stringify(images || [])
    )
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(result.lastInsertRowid) as any
    try { tool.images = JSON.parse(tool.images) } catch { tool.images = [] }
    res.json({ success: true, data: tool })
  } catch (error) {
    res.status(500).json({ success: false, error: '发布工具失败' })
  }
})

router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as any
    if (!tool) {
      res.status(404).json({ success: false, error: '工具不存在' })
      return
    }
    if (tool.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只能修改自己的工具' })
      return
    }
    const { name, category_id, description, deposit, images } = req.body
    const updates: string[] = []
    const values: any[] = []
    if (name !== undefined) { updates.push('name = ?'); values.push(name) }
    if (category_id !== undefined) { updates.push('category_id = ?'); values.push(category_id) }
    if (description !== undefined) { updates.push('description = ?'); values.push(description) }
    if (deposit !== undefined) { updates.push('deposit = ?'); values.push(deposit) }
    if (images !== undefined) { updates.push('images = ?'); values.push(JSON.stringify(images)) }
    if (updates.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }
    values.push(req.params.id)
    db.prepare(`UPDATE tools SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const updated = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as any
    try { updated.images = JSON.parse(updated.images) } catch { updated.images = [] }
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新工具失败' })
  }
})

router.delete('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as any
    if (!tool) {
      res.status(404).json({ success: false, error: '工具不存在' })
      return
    }
    if (tool.user_id !== req.user!.id && req.user!.role !== 1) {
      res.status(403).json({ success: false, error: '没有删除权限' })
      return
    }
    db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除工具失败' })
  }
})

router.put('/:id/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as any
    if (!tool) {
      res.status(404).json({ success: false, error: '工具不存在' })
      return
    }
    if (tool.user_id !== req.user!.id && req.user!.role !== 1) {
      res.status(403).json({ success: false, error: '没有修改权限' })
      return
    }
    const { status } = req.body
    if (status === undefined) {
      res.status(400).json({ success: false, error: '状态值为必填项' })
      return
    }
    db.prepare('UPDATE tools SET status = ? WHERE id = ?').run(status, req.params.id)
    const updated = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id) as any
    try { updated.images = JSON.parse(updated.images) } catch { updated.images = [] }
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新工具状态失败' })
  }
})

export default router
