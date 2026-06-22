import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const notices = db.prepare(`SELECT n.*, u.name as author_name
      FROM notices n
      LEFT JOIN users u ON n.author_id = u.id
      ORDER BY n.is_top DESC, n.created_at DESC`).all() as any[]
    res.json({ success: true, data: notices })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公告列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const notice = db.prepare(`SELECT n.*, u.name as author_name
      FROM notices n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?`).get(req.params.id) as any
    if (!notice) {
      res.status(404).json({ success: false, error: '公告不存在' })
      return
    }
    res.json({ success: true, data: notice })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公告详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { title, content, is_top } = req.body
    if (!title || !content) {
      res.status(400).json({ success: false, error: '标题和内容为必填项' })
      return
    }
    const result = db.prepare('INSERT INTO notices (author_id, title, content, is_top) VALUES (?, ?, ?, ?)').run(
      req.user!.id, title, content, is_top || 0
    )
    const notice = db.prepare('SELECT * FROM notices WHERE id = ?').get(result.lastInsertRowid) as any
    res.json({ success: true, data: notice })
  } catch (error) {
    res.status(500).json({ success: false, error: '发布公告失败' })
  }
})

export default router
