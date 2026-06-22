import { Router, type Request, type Response } from 'express'
import { db } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id) as any[]
    res.json({ success: true, data: notifications })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取通知列表失败' })
  }
})

router.get('/unread', authMiddleware, (req: Request, res: Response): void => {
  try {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user!.id) as { count: number }
    res.json({ success: true, data: { count: result.count } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取未读数量失败' })
  }
})

router.put('/:id/read', authMiddleware, (req: Request, res: Response): void => {
  try {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any
    if (!notification) {
      res.status(404).json({ success: false, error: '通知不存在' })
      return
    }
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id)
    res.json({ success: true, message: '已标记为已读' })
  } catch (error) {
    res.status(500).json({ success: false, error: '标记已读失败' })
  }
})

export default router
