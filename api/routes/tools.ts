import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

function recordSearchKeyword(keyword: string) {
  if (!keyword || keyword.trim() === '') return
  const trimmedKeyword = keyword.trim().toLowerCase()
  const existing = db.prepare('SELECT id FROM search_keywords WHERE keyword = ?').get(trimmedKeyword) as any
  if (existing) {
    db.prepare('UPDATE search_keywords SET search_count = search_count + 1, last_searched_at = datetime(\'now\') WHERE id = ?').run(existing.id)
  } else {
    db.prepare('INSERT INTO search_keywords (keyword) VALUES (?)').run(trimmedKeyword)
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category_id, keyword, status, sort, page, pageSize } = req.query
    let sql = `SELECT t.*, u.name as user_name, c.name as category_name
      FROM tools t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1`
    const params: any[] = []
    if (category_id !== undefined && category_id !== null && category_id !== '') {
      const catId = Number(category_id)
      if (!isNaN(catId) && catId > 0) {
        sql += ' AND t.category_id = ?'
        params.push(catId)
      }
    }
    if (keyword && keyword !== '') {
      sql += ' AND t.name LIKE ?'
      params.push(`%${keyword}%`)
      recordSearchKeyword(keyword as string)
    }
    if (status !== undefined && status !== '') {
      const statusVal = Number(status)
      if (!isNaN(statusVal)) {
        sql += ' AND t.status = ?'
        params.push(statusVal)
      }
    }
    let orderSql = ' ORDER BY t.created_at DESC'
    if (sort === 'hot') {
      orderSql = ' ORDER BY t.borrow_count DESC, t.created_at DESC'
    } else if (sort === 'deposit_asc') {
      orderSql = ' ORDER BY t.deposit ASC, t.created_at DESC'
    } else if (sort === 'deposit_desc') {
      orderSql = ' ORDER BY t.deposit DESC, t.created_at DESC'
    }
    sql += orderSql
    const pageNum = page ? Number(page) : 1
    const size = pageSize ? Number(pageSize) : 12
    if (!isNaN(pageNum) && !isNaN(size) && pageNum > 0 && size > 0) {
      const offset = (pageNum - 1) * size
      sql += ' LIMIT ? OFFSET ?'
      params.push(size, offset)
    }
    const tools = db.prepare(sql).all(...params) as any[]
    tools.forEach(t => { try { t.images = JSON.parse(t.images) } catch { t.images = [] } })
    let countSql = `SELECT COUNT(*) as total FROM tools t WHERE 1=1`
    const countParams: any[] = []
    if (category_id !== undefined && category_id !== null && category_id !== '') {
      const catId = Number(category_id)
      if (!isNaN(catId) && catId > 0) {
        countSql += ' AND t.category_id = ?'
        countParams.push(catId)
      }
    }
    if (keyword && keyword !== '') {
      countSql += ' AND t.name LIKE ?'
      countParams.push(`%${keyword}%`)
    }
    if (status !== undefined && status !== '') {
      const statusVal = Number(status)
      if (!isNaN(statusVal)) {
        countSql += ' AND t.status = ?'
        countParams.push(statusVal)
      }
    }
    const countResult = db.prepare(countSql).get(...countParams) as { total: number }
    res.json({ success: true, data: tools, total: countResult.total })
  } catch (error) {
    console.error('获取工具列表失败:', error)
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
    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, error: '工具名称为必填项' })
      return
    }
    if (category_id === undefined || category_id === null || category_id === '') {
      res.status(400).json({ success: false, error: '工具分类为必填项' })
      return
    }
    const categoryId = Number(category_id)
    if (isNaN(categoryId) || categoryId < 1) {
      res.status(400).json({ success: false, error: '工具分类格式不正确' })
      return
    }
    const depositAmount = deposit !== undefined && deposit !== null ? Number(deposit) : 0
    if (isNaN(depositAmount) || depositAmount < 0) {
      res.status(400).json({ success: false, error: '押金金额格式不正确' })
      return
    }
    const imagesArray = Array.isArray(images) ? images : []
    const isAdmin = req.user!.role === 1
    const initialStatus = isAdmin ? 1 : 0
    const result = db.prepare('INSERT INTO tools (user_id, name, category_id, description, deposit, images, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      req.user!.id, name.trim(), categoryId, description || '', depositAmount, JSON.stringify(imagesArray), initialStatus
    )
    const tool = db.prepare('SELECT * FROM tools WHERE id = ?').get(result.lastInsertRowid) as any
    try { tool.images = JSON.parse(tool.images) } catch { tool.images = [] }
    res.json({ success: true, data: tool })
  } catch (error) {
    console.error('发布工具失败:', error)
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

router.get('/hot-keywords', (req: Request, res: Response): void => {
  try {
    const { limit } = req.query
    const keywords = db.prepare(`
      SELECT keyword, search_count
      FROM search_keywords
      ORDER BY search_count DESC, last_searched_at DESC
      LIMIT ?
    `).all(Number(limit) || 10) as any[]
    res.json({ success: true, data: keywords })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取热门搜索词失败' })
  }
})

export default router
